const mongoose = require("mongoose");
const dns = require("dns");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Path to the mock database file
const dbFile = path.join(__dirname, "../mock_db.json");

// Helper to initialize the mock database with some initial sample data
const initMockDB = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(
      dbFile,
      JSON.stringify(
        {
          users: [],
          resources: [
            {
              _id: "res_mock_1",
              title: "Introduction to Fractions",
              description: "A comprehensive guide to teaching fractions to primary schoolers.",
              category: "Lesson Plan",
              subject: "Math",
              gradeLevel: "Primary",
              content: "Lesson content: 1. Fractions overview. 2. Visual exercises. 3. Interactive quizzes.",
              author: "user_mock_admin",
              downloadCount: 15,
              createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
            },
            {
              _id: "res_mock_2",
              title: "Photosynthesis Science Lab",
              description: "Hands-on activity explaining the light cycle using local plants.",
              category: "Activity",
              subject: "Science",
              gradeLevel: "Middle",
              content: "Science experiment: tracking sunlight, leaf coloration, and oxygen bubbles.",
              author: "user_mock_admin",
              downloadCount: 42,
              createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
            },
          ],
          folders: [],
          students: [],
        },
        null,
        2
      )
    );
  }
};

const readDB = () => {
  initMockDB();
  return JSON.parse(fs.readFileSync(dbFile, "utf8"));
};

const writeDB = (data) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf8");
};

// Generic Mock Query Builder
class MockQuery {
  constructor(items, collectionName, isSingle = false) {
    this.items = items;
    this.collectionName = collectionName;
    this.isSingle = isSingle;
    this.excludedFields = [];
  }

  select(fieldsStr) {
    if (typeof fieldsStr === "string") {
      const fields = fieldsStr.split(" ");
      fields.forEach((f) => {
        if (f.startsWith("-")) {
          this.excludedFields.push(f.substring(1));
        }
      });
    }
    return this;
  }

  populate(path, select) {
    const db = readDB();
    const users = db.users || [];
    const resources = db.resources || [];

    const populated = this.items.map((item) => {
      const copy = { ...item };

      if (path === "author") {
        const authorId = copy.author ? (copy.author._id || copy.author).toString() : null;
        const user = users.find((u) => u._id.toString() === authorId) || {
          _id: "user_mock_admin",
          name: "Dr. Elizabeth Vance",
          schoolName: "Apex High School",
        };
        copy.author = { _id: user._id, name: user.name, schoolName: user.schoolName };
      } else if (path === "owner") {
        const ownerId = copy.owner ? (copy.owner._id || copy.owner).toString() : null;
        const user = users.find((u) => u._id.toString() === ownerId) || {
          _id: "user_mock_admin",
          name: "Dr. Elizabeth Vance",
          schoolName: "Apex High School",
          email: "elizabeth.vance@apex.edu",
        };
        copy.owner = { _id: user._id, name: user.name, schoolName: user.schoolName, email: user.email };
      } else if (path === "sharedWith.user") {
        if (Array.isArray(copy.sharedWith)) {
          copy.sharedWith = copy.sharedWith.map((s) => {
            const userId = s.user ? (s.user._id || s.user).toString() : null;
            const user = users.find((u) => u._id.toString() === userId);
            return user
              ? { ...s, user: { _id: user._id, name: user.name, schoolName: user.schoolName, email: user.email } }
              : s;
          });
        }
      } else if (path === "resources") {
        if (Array.isArray(copy.resources)) {
          copy.resources = copy.resources.map((resId) => {
            const res = resources.find((r) => r._id.toString() === resId.toString());
            return res ? { ...res } : resId;
          });
        }
      } else if (typeof path === "object" && path.path === "resources") {
        if (Array.isArray(copy.resources)) {
          copy.resources = copy.resources.map((resId) => {
            let res = resources.find((r) => r._id.toString() === resId.toString());
            if (res) {
              res = { ...res };
              const authorId = res.author ? (res.author._id || res.author).toString() : null;
              const user = users.find((u) => u._id.toString() === authorId) || {
                _id: "user_mock_admin",
                name: "Dr. Elizabeth Vance",
                schoolName: "Apex High School",
              };
              res.author = { _id: user._id, name: user.name, schoolName: user.schoolName };
            }
            return res || resId;
          });
        }
      }
      return copy;
    });

    this.items = populated;
    return this;
  }

  sort(sortObj) {
    const key = Object.keys(sortObj)[0];
    const order = sortObj[key];
    this.items = [...this.items].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      if (typeof valA === "string") {
        return order === -1 ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return order === -1 ? valB - valA : valA - valB;
    });
    return this;
  }

  limit(num) {
    this.items = this.items.slice(0, num);
    return this;
  }

  exec() {
    return this;
  }

  then(onFulfilled, onRejected) {
    let documents = this.items.map((item) => {
      const doc = new MockDocument(item, this.collectionName, null);
      if (this.excludedFields.length > 0) {
        this.excludedFields.forEach((field) => delete doc[field]);
      }
      return doc;
    });

    const result = this.isSingle ? (documents[0] || null) : documents;
    return Promise.resolve().then(() => onFulfilled(result), onRejected);
  }
}

// Mock Document wrapper
class MockDocument {
  constructor(data, collectionName, model) {
    Object.assign(this, data);
    this._collectionName = collectionName;
    this._model = model;
    
    // virtuals
    if (this._id) {
      this.id = this._id.toString();
    }
  }

  select(fieldsStr) {
    const copy = { ...this };
    if (typeof fieldsStr === "string" && fieldsStr.startsWith("-")) {
      const field = fieldsStr.substring(1);
      delete copy[field];
    }
    return copy;
  }

  async save() {
    const db = readDB();
    const list = db[this._collectionName] || [];
    const idx = list.findIndex((u) => u._id.toString() === this._id.toString());

    const plainObj = {};
    for (let key in this) {
      if (!key.startsWith("_") && typeof this[key] !== "function" && key !== "id") {
        plainObj[key] = this[key];
      }
    }

    if (idx !== -1) {
      list[idx] = plainObj;
    } else {
      list.push(plainObj);
    }
    
    db[this._collectionName] = list;
    writeDB(db);
    return this;
  }

  toString() {
    return this._id ? this._id.toString() : "";
  }
}

// Mock Model Class matching Mongoose Model APIs
class MockModel {
  constructor(modelName, collectionName) {
    this.modelName = modelName;
    this.collectionName = collectionName;
  }

  getColl() {
    return readDB()[this.collectionName] || [];
  }

  saveColl(data) {
    const db = readDB();
    db[this.collectionName] = data;
    writeDB(db);
  }

  find(query = {}) {
    let list = this.getColl();

    if (query && Object.keys(query).length > 0) {
      list = list.filter((item) => {
        for (let key in query) {
          if (key === "$or" && Array.isArray(query.$or)) {
            let matchedOr = false;
            for (let subq of query.$or) {
              let matchesSub = true;
              for (let k in subq) {
                if (k === "sharedWith.user") {
                  const val = subq[k];
                  const hasUser =
                    item.sharedWith &&
                    item.sharedWith.some(
                      (s) => (s.user && s.user._id ? s.user._id.toString() : s.user.toString()) === val.toString()
                    );
                  if (!hasUser) matchesSub = false;
                } else if (item[k] === undefined || item[k].toString() !== subq[k].toString()) {
                  matchesSub = false;
                }
              }
              if (matchesSub) matchedOr = true;
            }
            if (!matchedOr) return false;
          } else if (key === "sharedWith.user") {
            const val = query[key];
            const hasUser =
              item.sharedWith &&
              item.sharedWith.some(
                (s) => (s.user && s.user._id ? s.user._id.toString() : s.user.toString()) === val.toString()
              );
            if (!hasUser) return false;
          } else if (query[key] && (query[key].$gte || query[key].$lte || query[key].$gt || query[key].$lt)) {
            const val = new Date(item[key]).getTime();
            if (query[key].$gte && val < new Date(query[key].$gte).getTime()) return false;
            if (query[key].$gt && val <= new Date(query[key].$gt).getTime()) return false;
            if (query[key].$lte && val > new Date(query[key].$lte).getTime()) return false;
            if (query[key].$lt && val >= new Date(query[key].$lt).getTime()) return false;
          } else if (query[key] && query[key].$regex) {
            const regex = new RegExp(query[key].$regex, query[key].$options || "i");
            if (!regex.test(item[key] || "")) return false;
          } else if (item[key] === undefined || item[key].toString() !== query[key].toString()) {
            return false;
          }
        }
        return true;
      });
    }

    return new MockQuery(list, this.collectionName, false);
  }

  findOne(query) {
    const list = this.find(query).items;
    return new MockQuery(list.slice(0, 1), this.collectionName, true);
  }

  findById(id) {
    if (!id) return new MockQuery([], this.collectionName, true);
    const item = this.getColl().find((u) => u._id.toString() === id.toString());
    return new MockQuery(item ? [item] : [], this.collectionName, true);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const list = this.getColl();
    const idx = list.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return null;

    let item = { ...list[idx] };
    if (update.$set) {
      item = { ...item, ...update.$set };
    } else if (update.$inc) {
      for (let k in update.$inc) {
        item[k] = (item[k] || 0) + update.$inc[k];
      }
    } else if (update.$push) {
      for (let k in update.$push) {
        if (!item[k]) item[k] = [];
        item[k].push(update.$push[k]);
      }
    } else {
      item = { ...item, ...update };
    }

    list[idx] = item;
    this.saveColl(list);
    return new MockDocument(item, this.collectionName, this);
  }

  async findByIdAndDelete(id) {
    const list = this.getColl();
    const filtered = list.filter((u) => u._id.toString() !== id.toString());
    this.saveColl(filtered);
    return { _id: id };
  }

  async deleteOne(query) {
    const list = this.getColl();
    const idx = list.findIndex((u) => {
      for (let k in query) {
        if (u[k] !== query[k]) return false;
      }
      return true;
    });
    if (idx !== -1) {
      list.splice(idx, 1);
      this.saveColl(list);
    }
    return { deletedCount: idx !== -1 ? 1 : 0 };
  }

  async deleteMany(query) {
    let list = this.getColl();
    const initialLen = list.length;
    list = list.filter((u) => {
      for (let k in query) {
        if (u[k] === query[k]) return false;
      }
      return true;
    });
    this.saveColl(list);
    return { deletedCount: initialLen - list.length };
  }

  async create(data) {
    const list = this.getColl();
    const newDoc = {
      _id: "mock_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...data,
    };
    list.push(newDoc);
    this.saveColl(list);
    return new MockDocument(newDoc, this.collectionName, this);
  }

  async countDocuments(query = {}) {
    if (query && Object.keys(query).length > 0) {
      return this.find(query).items.length;
    }
    return this.getColl().length;
  }

  async aggregate(pipeline) {
    let list = this.getColl();
    const matchStage = pipeline.find((stage) => stage.$match);
    if (matchStage && matchStage.$match) {
      list = this.find(matchStage.$match).items;
    }
    const groupStage = pipeline.find((stage) => stage.$group);
    if (groupStage) {
      const group = groupStage.$group;
      const idField = group._id;
      const result = {};

      list.forEach((item) => {
        let key = null;
        if (typeof idField === "string" && idField.startsWith("$")) {
          key = item[idField.substring(1)];
        } else if (typeof idField === "object" && idField !== null) {
          if (idField.$dateToString) {
            const fieldName = idField.$dateToString.date ? idField.$dateToString.date.replace(/^\$/, "") : "createdAt";
            const dateVal = item[fieldName];
            if (dateVal) {
              const d = new Date(dateVal);
              key = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : String(dateVal);
            } else {
              key = "Unknown";
            }
          }
        }

        if (!result[key]) {
          result[key] = { _id: key };
          for (let field in group) {
            if (field !== "_id") {
              result[key][field] = 0;
            }
          }
        }

        for (let field in group) {
          if (field !== "_id") {
            const oper = group[field];
            if (oper.$sum) {
              if (oper.$sum === 1) {
                result[key][field] += 1;
              } else if (typeof oper.$sum === "string" && oper.$sum.startsWith("$")) {
                const val = item[oper.$sum.substring(1)] || 0;
                result[key][field] += val;
              }
            }
          }
        }
      });

      let resList = Object.values(result);
      const sortStage = pipeline.find((stage) => stage.$sort);
      if (sortStage) {
        const sortKey = Object.keys(sortStage.$sort)[0];
        const sortOrder = sortStage.$sort[sortKey];
        resList.sort((a, b) => {
          const valA = a[sortKey] !== undefined ? a[sortKey] : "";
          const valB = b[sortKey] !== undefined ? b[sortKey] : "";
          if (valA < valB) return -1 * sortOrder;
          if (valA > valB) return 1 * sortOrder;
          return 0;
        });
      }

      return resList;
    }
    return [];
  }
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL;
  console.log("Connecting to MongoDB Atlas URI:", uri);

  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      // Ignore dns setServers error if custom DNS is locked
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB Connected Successfully to cloud Atlas database!");
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    console.log("Falling back to local mock database.");
    setupMockMongoose();
  }
};

function setupMockMongoose() {
  console.log("Initializing in-memory/file-based Mock Mongoose models.");
  initMockDB();

  // Patch mongoose
  mongoose.connect = async () => {
    console.log("Mock DB connected.");
    return mongoose;
  };
  
  mongoose.connection = {
    on: () => {},
    once: () => {},
  };

  const mockModels = {};
  mongoose.model = function (name, schema) {
    let collName = name.toLowerCase() + "s";
    if (name === "User") collName = "users";
    if (name === "Resource") collName = "resources";
    if (name === "Folder") collName = "folders";
    if (name === "Student") collName = "students";
    
    if (!mockModels[name]) {
      mockModels[name] = new MockModel(name, collName);
    }
    return mockModels[name];
  };

  // Mock Types.ObjectId
  mongoose.Types = {
    ObjectId: (id) => id || "mock_id",
  };
}

module.exports = connectDB;