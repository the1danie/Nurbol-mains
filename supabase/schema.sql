-- Health Impact Monitor — схема базы данных
-- Supabase PostgreSQL

-- Таблица профилей преподавателей
CREATE TABLE IF NOT EXISTS teachers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  department TEXT,
  position TEXT,
  years_of_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица расписания (учебная нагрузка)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  lesson_type TEXT DEFAULT 'lecture', -- lecture, practice, lab, seminar
  hours NUMERIC(3,1) NOT NULL DEFAULT 2,
  group_name TEXT,
  room TEXT,
  windows_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица показателей здоровья (ежедневные записи)
CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  blood_pressure_sys INTEGER,
  blood_pressure_dia INTEGER,
  heart_rate INTEGER,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  steps INTEGER DEFAULT 0,
  water_ml INTEGER DEFAULT 0,
  exercises_done BOOLEAN DEFAULT FALSE,
  exercise_minutes INTEGER DEFAULT 0,
  pain_head BOOLEAN DEFAULT FALSE,
  pain_back BOOLEAN DEFAULT FALSE,
  pain_neck BOOLEAN DEFAULT FALSE,
  pain_eyes BOOLEAN DEFAULT FALSE,
  pain_other TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

-- Таблица ежедневных опросников
CREATE TABLE IF NOT EXISTS daily_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 10),
  anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
  satisfaction_work INTEGER CHECK (satisfaction_work BETWEEN 1 AND 10),
  lessons_count INTEGER DEFAULT 0,
  felt_overwhelmed BOOLEAN DEFAULT FALSE,
  had_conflicts BOOLEAN DEFAULT FALSE,
  extra_work_hours NUMERIC(4,1) DEFAULT 0,
  complaints TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

-- Row Level Security (RLS)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_surveys ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если существуют
DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can manage own schedules" ON schedules;
DROP POLICY IF EXISTS "Teachers can manage own health records" ON health_records;
DROP POLICY IF EXISTS "Teachers can manage own surveys" ON daily_surveys;

-- Политики безопасности
CREATE POLICY "Teachers can view own profile" ON teachers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Teachers can manage own schedules" ON schedules FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own health records" ON health_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own surveys" ON daily_surveys FOR ALL USING (auth.uid() = teacher_id);

-- Представление: сводные данные по дням
CREATE OR REPLACE VIEW daily_summary AS
SELECT
  hr.teacher_id,
  hr.date,
  hr.blood_pressure_sys,
  hr.blood_pressure_dia,
  hr.heart_rate,
  hr.stress_level,
  hr.sleep_quality,
  hr.fatigue_level,
  hr.energy_level,
  hr.steps,
  hr.water_ml,
  ds.mood,
  ds.anxiety_level,
  ds.satisfaction_work,
  ds.lessons_count,
  ds.felt_overwhelmed,
  -- Индекс нагрузки (0-100)
  LEAST(100, ROUND(
    COALESCE(ds.lessons_count, 0) * 10 +
    COALESCE(ds.extra_work_hours, 0) * 5 +
    CASE WHEN ds.felt_overwhelmed THEN 20 ELSE 0 END
  )) AS workload_index,
  -- Индекс усталости (0-100)
  ROUND(
    (COALESCE(hr.fatigue_level, 5) * 10 +
    (10 - COALESCE(hr.energy_level, 5)) * 10) / 2.0
  ) AS fatigue_index,
  -- Индекс стресса (0-100)
  ROUND(
    (COALESCE(hr.stress_level, 5) * 10 +
    COALESCE(ds.anxiety_level, 5) * 10) / 2.0
  ) AS stress_index,
  -- Индекс общего здоровья (0-100)
  ROUND(
    (COALESCE(hr.sleep_quality, 5) * 10 +
    COALESCE(hr.energy_level, 5) * 10 +
    (10 - COALESCE(hr.stress_level, 5)) * 5 +
    COALESCE(ds.satisfaction_work, 5) * 5) / 4.0
  ) AS health_index
FROM health_records hr
LEFT JOIN daily_surveys ds ON hr.teacher_id = ds.teacher_id AND hr.date = ds.date;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Функция автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure role is set to authenticated (GoTrue may leave it empty)
  IF NEW.role IS NULL OR NEW.role = '' THEN
    UPDATE auth.users SET role = 'authenticated' WHERE id = NEW.id;
  END IF;
  INSERT INTO public.teachers (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
