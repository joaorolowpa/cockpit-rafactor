import { dictionary, labelDictionary } from "../utils/dictionary";

export const formatHierarchy = (data) =>
  Object.entries(data).map(([key, value]) => {
    // Calcula o total de cada categoria
    const total = Object.values(value).reduce(
      (sum, subValue) => sum + subValue,
      0,
    );

    return {
      name: dictionary[key],
      children: Object.entries(value).map(([subKey, subValue]) => ({
        name: labelDictionary[subKey],
        value: subValue / 1000000,
        percentage: ((subValue / total) * 100).toFixed(2) + "%", // Calcula e adiciona a porcentagem
      })),
    };
  });
