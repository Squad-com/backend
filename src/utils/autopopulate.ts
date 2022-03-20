import { NextFunction } from 'express';

const autopopulate = (field: any) =>
  function (next: NextFunction) {
    this.populate(field);
    next();
  };

export default autopopulate;
