/**
 * @param {typeof config} config
 */
module.exports =
  (config) =>
  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  (req, res, next) => {
    res.locals.serviceName = config.serviceName
    next()
  }

/**
 * @import { NextFunction, Request, Response } from 'express'
 * @import config from './config.js'
 */

const icd10 = require('../app/data/icd10')

module.exports = (config) => (req, res, next) => {
  res.locals.icd10 = icd10
  next()
}