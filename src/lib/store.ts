
"use client";

import { Reminder } from "./types";

const STORAGE_KEY = 'near-remind-data';

export const getReminders = (): Reminder[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveReminder = (reminder: Reminder) => {
  const reminders = getReminders();
  const index = reminders.findIndex(r => r.id === reminder.id);
  if (index > -1) {
    reminders[index] = reminder;
  } else {
    reminders.push(reminder);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
};

export const deleteReminder = (id: string) => {
  const reminders = getReminders().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
};

export const toggleReminder = (id: string) => {
  const reminders = getReminders().map(r => 
    r.id === id ? { ...r, isActive: !r.isActive } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
};
