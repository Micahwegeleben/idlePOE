export const parseDragData = (event) => {
  try {
    const payload = event.dataTransfer?.getData("application/json");
    return payload ? JSON.parse(payload) : null;
  } catch (error) {
    console.error("Failed to parse drag payload", error);
    return null;
  }
};
