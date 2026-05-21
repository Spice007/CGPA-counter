const db = require('../config/db');

class PostgresDB {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async find(query = {}) {
        let sql = `SELECT * FROM ${this.tableName}`;
        const values = [];
        const conditions = [];

        Object.entries(query).forEach(([key, value], index) => {
            // Handle camelCase mapping to quoted identifiers if needed
            // For now assume column names match keys exactly
            conditions.push(`"${key}" = $${index + 1}`);
            values.push(value);
        });

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await db.query(sql, values);
        const rows = result.rows.map(row => this._createInstance(row));

        // Mimic chainable query object
        const queryObj = {
            _results: rows,
            sort: function() { return this; }, // Simple placeholder
            select: function() { return this; },
            populate: function() { return this; },
            then: function(onFulfilled, onRejected) {
                return Promise.resolve(this._results).then(onFulfilled, onRejected);
            }
        };

        return queryObj;
    }

    findOne(query = {}) {
        const self = this;
        let sql = `SELECT * FROM ${this.tableName}`;
        const values = [];
        const conditions = [];

        Object.entries(query).forEach(([key, value], index) => {
            conditions.push(`"${key}" = $${index + 1}`);
            values.push(value);
        });

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }
        sql += ' LIMIT 1';

        const queryObj = {
            select: function() { return this; },
            populate: function() { return this; },
            then: async function(onFulfilled, onRejected) {
                try {
                    const result = await db.query(sql, values);
                    const item = result.rows[0] ? self._createInstance(result.rows[0]) : null;
                    return Promise.resolve(onFulfilled(item));
                } catch (err) {
                    return Promise.resolve(onRejected ? onRejected(err) : null);
                }
            }
        };

        return queryObj;
    }

    findById(id) {
        const self = this;
        const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
        
        const queryObj = {
            select: function() { return this; },
            populate: function() { return this; },
            then: async function(onFulfilled, onRejected) {
                try {
                    const result = await db.query(sql, [id]);
                    const item = result.rows[0] ? self._createInstance(result.rows[0]) : null;
                    return Promise.resolve(onFulfilled(item));
                } catch (err) {
                    return Promise.resolve(onRejected ? onRejected(err) : null);
                }
            }
        };
        return queryObj;
    }

    async create(data) {
        const keys = Object.keys(data).map(k => `"${k}"`).join(', ');
        const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(data);

        const sql = `INSERT INTO ${this.tableName} (${keys}) VALUES (${placeholders}) RETURNING *`;
        const result = await db.query(sql, values);
        return this._createInstance(result.rows[0]);
    }

    _createInstance(data) {
        if (!data) return null;
        
        const self = this;
        const instance = { ...data };

        // Ensure id property exists (mapped from Postgres primary key)
        instance._id = data.id;

        instance.save = async function() {
            const keys = Object.keys(this).filter(k => k !== 'id' && k !== '_id' && typeof this[k] !== 'function');
            const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            const values = keys.map(k => this[k]);
            
            const sql = `UPDATE ${self.tableName} SET ${setClause}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`;
            values.push(this.id);

            const result = await db.query(sql, values);
            return self._createInstance(result.rows[0]);
        };

        instance.deleteOne = async function() {
            const sql = `DELETE FROM ${self.tableName} WHERE id = $1`;
            await db.query(sql, [this.id]);
            return { deletedCount: 1 };
        };

        return instance;
    }
}

module.exports = PostgresDB;
