class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) Building a query
    const queryObj = { ...this.queryString }; //this is a deep copy
    // 2) Filtering
    const excludedFeilds = ['page', 'sort', 'limit', 'fields'];
    excludedFeilds.forEach((el) => delete queryObj[el]);

    // 3) Advanced Filtering
    let querystr = JSON.stringify(queryObj);
    querystr = querystr.replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(querystr)); //we are just giving this function a name

    return this;
  }

  sort() {
    // 4) Sorting

    if (this.queryString.sort) {
      const sortquery = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortquery);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limit() {
    // 5) Feild Limiting

    if (this.queryString.fields) {
      const x = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(x);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 6) Pagination
  paginate() {
    const page = this.queryString.page * 1 || 1; //default value 1
    const limit = this.queryString.limit * 1 || 100; //default  value 100
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIfeatures;
