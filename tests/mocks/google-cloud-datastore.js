// Mock for @google-cloud/datastore
const mockGet = jest.fn().mockResolvedValue([{ Credits: 100 }]);
const mockSave = jest.fn().mockResolvedValue([{ mutationResults: [{}] }]);
const mockKey = jest.fn().mockReturnValue('mock-key');
const mockCreateQuery = jest.fn().mockReturnThis();
const mockFilter = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockRunQuery = jest.fn().mockResolvedValue([[]]);

class DatastoreMock {
  constructor() {
    this.get = mockGet;
    this.save = mockSave;
    this.key = mockKey;
    this.createQuery = mockCreateQuery;
    this.filter = mockFilter;
    this.limit = mockLimit;
    this.runQuery = mockRunQuery;
  }
}

module.exports = {
  Datastore: DatastoreMock,
  // Export the mocks so tests can configure them
  mockGet,
  mockSave,
  mockKey,
  mockCreateQuery,
  mockFilter,
  mockLimit,
  mockRunQuery
};