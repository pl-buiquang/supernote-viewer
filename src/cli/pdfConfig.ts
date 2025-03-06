export const YEAR = 2025;
const YEAR_DAYS = 365;

const generateWeeksConfig = (weeksCount: number) => {
  const weeksArray = Array.from({ length: weeksCount }, (_, i) => i + 1);
  return weeksArray.map((week) => {
    return {
      title: `${YEAR}-W${week.toString().padStart(2, '0')}`,
      pageNumbers: [week + 18],
    };
  });
};

const generateMonthsConfig = (monthsCount: number) => {
  const monthsArray = Array.from({ length: monthsCount }, (_, i) => i + 1);
  return monthsArray.map((month) => {
    return {
      title: new Date(YEAR, month - 1).toLocaleString('fr-FR', { month: 'long' }).toLocaleLowerCase(),
      pageNumbers: [month + 6],
    };
  });
};

export const pdfMarkdownConfig = {
  year: [
    {
      title: `${YEAR}`,
      pageNumbers: Array.from({ length: 105 }, (_, i) => i + 1170),
    },
  ],
  quarters: [
    {
      title: `${YEAR}-Q1`,
      pageNumbers: [3],
    },
    {
      title: `${YEAR}-Q2`,
      pageNumbers: [4],
    },
    {
      title: `${YEAR}-Q3`,
      pageNumbers: [5],
    },
    {
      title: `${YEAR}-Q4`,
      pageNumbers: [6],
    },
  ],
  months: generateMonthsConfig(12),
  weeks: generateWeeksConfig(52),
  days: Array.from({ length: YEAR_DAYS }, (_, i) => {
    return {
      title: new Date(YEAR, 0, i + 1).toISOString().split('T')[0],
      pageNumber: [i + 71, i + 436],
    };
  }),
};
