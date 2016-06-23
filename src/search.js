import get from 'lodash/get';

const multipleColumns = ({
  data, columns, query, strategy, transform,
}) => {
  if (!query) {
    return data;
  }

  return Object.keys(query).reduce(
    (filteredData, searchedColumn) =>
      singleColumn({
        data: filteredData,
        columns,
        searchedColumn,
        query: query[searchedColumn],
        strategy,
        transform,
      }),
    data
  );
};

const singleColumn = ({
  data, columns, searchColumn = 'all', query, strategy, transform,
}) => {
  if (!query) {
    return data;
  }

  let ret = columns;

  if (searchColumn !== 'all') {
    ret = columns.filter(col => col.cell && col.cell.property === searchColumn);
  }

  return data.filter(row => ret.filter(column => columnMatches({
    query, column, strategy, transform, row,
  }).length > 0).length > 0);
};

const columnMatches = ({
  query, column = { cell: {} }, row, strategy, transform,
}) => {
  const property = column.cell.property;
  const value = get(row, property);
  const formatter = column.cell.value || (a => a);
  let formattedValue = formatter(value);

  if (typeof formattedValue === 'undefined') {
    formattedValue = '';
  }

  formattedValue = formattedValue.toString ? formattedValue.toString() : '';

  return matches({
    value: formattedValue,
    query,
    strategy,
    transform,
  });
};

const matches = ({
  value,
  query,
  strategy = predicates.infix,
  transform = v => v.toLowerCase(),
} = {}) => {
  if (!query) {
    return {};
  }

  return strategy(transform(query)).matches(transform(value));
};

const infix = value => ({
  evaluate(searchText) {
    return searchText.indexOf(value) !== -1;
  },
  matches(searchText) {
    const splitString = searchText.split(value);
    const result = [];
    let currentPosition = 0;

    for (let x = 0; x < splitString.length; x++) {
      result.push({
        startIndex: currentPosition + splitString[x].length,
        length: value.length,
      });

      currentPosition += splitString[x].length + value.length;
    }

    result.pop();

    return result;
  },
});

const prefix = value => ({
  evaluate(searchText) {
    return searchText.indexOf(value) === 0;
  },
  matches(searchText) {
    const prefixIndex = searchText.indexOf(value);

    if (prefixIndex === 0) {
      return [
        {
          startIndex: 0,
          length: value.length,
        },
      ];
    }

    return [];
  },
});

const predicates = {
  infix,
  prefix,
};

export default {
  multipleColumns,
  singleColumn,
  columnMatches,
  matches,
  predicates,
};