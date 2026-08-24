export interface Church {
  id: number;
  name: string;
  type: string;
  pastor?: string;
  members?: number;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  role: 'master' | 'standard';
  church_id: number;
  church_name?: string;
  authorized?: boolean;
}

export interface Class {
  id: number;
  name: string;
  church_id: number;
  church_name?: string;
  active: boolean;
}

export interface Teacher {
  id: number;
  name: string;
  church_id: number;
  class_id: number;
  church_name?: string;
  class_name?: string;
  active: boolean;
}

export interface Student {
  id: number;
  name: string;
  birth_date: string;
  church_id: number;
  class_id: number;
  church_name?: string;
  class_name?: string;
  active: boolean;
}

export interface Magazine {
  id: number;
  title: string;
  quarter: string;
  year: number;
}

export interface Lesson {
  id: number;
  magazine_id: number;
  number: number;
  title: string;
  date: string;
  golden_text: string;
  suggested_hymns: string;
  magazine_title?: string;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  lesson_id: number;
  church_id: number;
  present: boolean;
  date: string;
  student_name?: string;
  lesson_title?: string;
  church_name?: string;
}

export interface Material {
  id: number;
  title: string;
  file_path: string;
  file_type: string;
  church_id: number;
  church_name?: string;
  cover_path?: string;
}

export interface ScheduleRecord {
  id: number;
  teacher_id: number;
  class_id: number;
  lesson_id: number;
  church_id: number;
  date: string;
  teacher_name?: string;
  class_name?: string;
  lesson_title?: string;
  church_name?: string;
}
