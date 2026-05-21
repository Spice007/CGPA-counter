const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'db.json');

class LocalDB {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    _readData() {
        try {
            if (!fs.existsSync(DB_PATH)) {
                return {};
            }
            const data = fs.readFileSync(DB_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading DB:', error);
            return {};
        }
    }

    _writeData(allData) {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(allData, null, 2));
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    }

    find(query = {}) {
        const allData = this._readData();
        const collection = allData[this.collectionName] || [];
        let results = collection.filter(item => {
            return Object.entries(query).every(([key, value]) => {
                if (value && typeof value === 'object' && value.toString() !== '[object Object]') {
                    return item[key] == value.toString();
                }
                return item[key] == value;
            });
        });

        // Create a query object that mimics Mongoose chainable methods
        const queryObj = {
            _results: results,
            sort: function(options) {
                const [field, order] = Object.entries(options)[0];
                this._results.sort((a, b) => {
                    if (order === -1) return new Date(b[field]) - new Date(a[field]);
                    return new Date(a[field]) - new Date(b[field]);
                });
                return this;
            },
            select: function() { return this; },
            populate: function() { return this; },
            then: function(onFulfilled, onRejected) {
                return Promise.resolve(this._results).then(onFulfilled, onRejected);
            }
        };

        return queryObj;
    }

    findOne(query = {}) {
        const allData = this._readData();
        const collection = allData[this.collectionName] || [];
        const item = collection.find(item => {
            return Object.entries(query).every(([key, value]) => {
                if (value && typeof value === 'object' && value.toString() !== '[object Object]') {
                    return item[key] == value.toString();
                }
                return item[key] == value;
            });
        });

        const queryObj = {
            _item: item ? this._createInstance(item) : null,
            select: function() { return this; },
            populate: function() { return this; },
            then: function(onFulfilled, onRejected) {
                return Promise.resolve(this._item).then(onFulfilled, onRejected);
            }
        };

        return queryObj;
    }

    findById(id) {
        const allData = this._readData();
        const collection = allData[this.collectionName] || [];
        const item = collection.find(i => i._id === id || i.id === id);
        
        const queryObj = {
            _item: item ? this._createInstance(item) : null,
            select: function() { return this; },
            populate: function() { return this; },
            then: function(onFulfilled, onRejected) {
                return Promise.resolve(this._item).then(onFulfilled, onRejected);
            }
        };
        return queryObj;
    }

    async create(data) {
        const allData = this._readData();
        if (!allData[this.collectionName]) allData[this.collectionName] = [];
        
        const id = crypto.randomUUID();
        const newItem = {
            ...data,
            _id: id,
            id: id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        allData[this.collectionName].push(newItem);
        this._writeData(allData);
        return this._createInstance(newItem);
    }

    _createInstance(data) {
        if (!data) return null;
        
        const self = this;
        const instance = { ...data };

        instance.select = function() { return this; };
        instance.populate = function() { return this; };
        instance.toString = function() { return this._id; };

        instance.save = async function() {
            const allData = self._readData();
            const collection = allData[self.collectionName] || [];
            const index = collection.findIndex(i => i._id === this._id);
            
            this.updatedAt = new Date().toISOString();
            const cleanData = { ...this };
            delete cleanData.save;
            delete cleanData.deleteOne;
            delete cleanData.select;
            delete cleanData.populate;
            delete cleanData.toString;

            if (index !== -1) {
                collection[index] = cleanData;
            } else {
                collection.push(cleanData);
            }
            
            allData[self.collectionName] = collection;
            self._writeData(allData);
            return self._createInstance(cleanData);
        };

        instance.deleteOne = async function() {
            const allData = self._readData();
            const collection = allData[self.collectionName] || [];
            allData[self.collectionName] = collection.filter(i => i._id !== this._id);
            self._writeData(allData);
            return { deletedCount: 1 };
        };

        return instance;
    }
}

module.exports = LocalDB;
