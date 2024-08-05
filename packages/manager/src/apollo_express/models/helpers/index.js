import util from 'util'

export function getFunctions () {
  const create = util.promisify(this.create.bind(this))
  const getById = util.promisify(this.getById.bind(this))
  const find = util.promisify(this.find.bind(this))
  const count = util.promisify(this.count.bind(this))
  const loadAll = util.promisify(this.loadAll.bind(this))
  this.createAndSave = async args => await create({ ...args })
  this.byId = async (id = {}, option = {}) => await getById(id, option)
  this.how_many = async (filter = {}, option = {}) => await count(filter, option)
  this.search = async (filter = {}, option = {}) => await find(filter, option)
  this.getAll = async instances => await loadAll(instances)
  
  this.prototype.del = async function () {
    const remove = util.promisify(this.remove.bind(this))
    await remove()
  }
  this.prototype.commit = async function () {
    const save = util.promisify(this.save.bind(this))
    await save()
  }
  this.prototype.expand = async function (path) {
    const load = util.promisify(this.load.bind(this))
    await load(path)
  }
  return this
}
