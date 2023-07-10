export const removeDuplicateObjectInArray = (list) =>
  list.filter((item, index) => {
    const _item = JSON.stringify(item);
    return (
      index ===
      list.findIndex((obj) => {
        return JSON.stringify(obj) === _item;
      })
    );
  });

export const parseJson = (data: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing json', error);
  }
  return null;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
  } catch (error) {
    return false;
  }
  return true;
};
