async function generateMeta(count, limit, page) {
  let pages;
  if (count > limit) {
    pages = Math.ceil(count / limit);
  } else {
    pages = 1;
  }
  const prev = 0;
  return {
    pages,
    page,
    prev: page !== 1 ? page - 1 : prev,
    next: page === pages ? 0 : page + 1,
    count,
  };
}

module.exports = { generateMeta };
