class APIFeature {
  constructor(req, queryDb) {
    this.queryReq = { ...req.query };
    this.queryDb = queryDb;
  }

  find() {
    const ignoredFields = ['page', 'limit', 'sort', 'fields'];
    let condition = { ...this.queryReq };
    ignoredFields.forEach((field) => delete condition[field]);
    condition = JSON.stringify(condition).replace(
      /\b(lte|lt|gte|gt)\b/g,
      (matcher) => `$${matcher}`
    );
    condition = JSON.parse(condition);
    this.queryDb.find(condition);
    return this;
  }

  sort() {
    const sortBy = this.queryReq.sort?.replace(',', ' ') || 'name';
    this.queryDb.sort(sortBy);
    return this;
  }

  selectFields() {
    const selectedFields = this.queryReq.fields?.replace(',', ' ') || '-__v';
    this.queryDb.select(selectedFields);
    return this;
  }

  paginate() {
    const page = this.queryReq.page * 1 || 1;
    const limit = this.queryReq.limit * 1 || 5;
    const skip = (page - 1) * limit;
    this.queryDb.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeature;
