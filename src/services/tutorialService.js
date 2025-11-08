import axios from "axios";
import { EXTERNAL_BASE_URL } from "../config/env.js";

export const fetchTutorial = async (tutorialId) => {
  const url = `${EXTERNAL_BASE_URL}/api/tutorials/${encodeURIComponent(
    tutorialId
  )}`;
  const { data } = await axios.get(url, { timeout: 15000 });
  return data; // assume shape contains HTML content
};

export const fetchUserPreferences = async (userId) => {
  if (!userId) return null;
  const url = `${EXTERNAL_BASE_URL}/api/users/${encodeURIComponent(
    userId
  )}/preferences`;
  const { data } = await axios.get(url, { timeout: 10000 });
  return data; // e.g., { difficulty, questionCount, language, ... }
};
