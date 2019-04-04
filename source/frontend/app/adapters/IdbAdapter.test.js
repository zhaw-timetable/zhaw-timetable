jest.mock('idb');

import idb from 'idb';

import idbAdapter from './IdbAdapter';

beforeEach(() => {
  idb.open = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      resolve({ close: () => {} });
    });
  });
});

it('idbAdapter should be defined', () => {
  expect(idbAdapter).toBeDefined();
});

it('getDBInstance should call idb.open', async () => {
  await idbAdapter.getDBInstance();
  expect(idb.open).toHaveBeenCalled();
});

it('getDBTransaction should return transaction from dbInstance', () => {
  const dbInstance = {
    transaction: () => 'transactionContent'
  };
  const returnValue = idbAdapter.getDBTransaction(dbInstance, 'accessMode');
  expect(returnValue).toEqual('transactionContent');
});

it('getUsername should return username from DBTransaction', async () => {
  const restore = idbAdapter.getDBTransaction;
  idbAdapter.getDBTransaction = jest.fn().mockImplementation(() => ({
    objectStore: () => ({
      get: () => {
        return new Promise(resolve => {
          resolve('userNameInStore');
        });
      }
    })
  }));
  const theme = await idbAdapter.getUsername();
  expect(theme).toEqual('userNameInStore');
  idbAdapter.getDBTransaction = restore;
});

it('getTheme should return theme from DBStore', async () => {
  const restore = idbAdapter.getDBTransaction;
  idbAdapter.getDBTransaction = jest.fn().mockImplementation(() => ({
    objectStore: () => ({
      get: () => {
        return new Promise(resolve => {
          resolve('themeInStore');
        });
      }
    })
  }));
  const theme = await idbAdapter.getTheme();
  expect(theme).toEqual('themeInStore');
  idbAdapter.getDBTransaction = restore;
});

it('setTheme should call DBStore put with correct parameters', async () => {
  const restore = idbAdapter.getDBTransaction;
  const putMock = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      resolve();
    });
  });
  idbAdapter.getDBTransaction = jest.fn().mockImplementation(() => ({
    objectStore: () => ({
      put: putMock
    })
  }));
  await idbAdapter.setTheme('newTheme');
  expect(putMock).toHaveBeenCalled();
  expect(putMock).toHaveBeenCalledWith({ id: 'theme', theme: 'newTheme' });
  idbAdapter.getDBTransaction = restore;
});

it('setUser should call DBStore put with correct parameters', async () => {
  const restore = idbAdapter.getDBTransaction;
  const putMock = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      resolve();
    });
  });
  idbAdapter.getDBTransaction = jest.fn().mockImplementation(() => ({
    objectStore: () => ({
      put: putMock
    })
  }));
  await idbAdapter.setUser('userName', 'userType');
  expect(putMock).toHaveBeenCalled();
  expect(putMock).toHaveBeenCalledWith({
    id: 'username',
    username: 'userName',
    type: 'userType'
  });
  idbAdapter.getDBTransaction = restore;
});

it('removeUser should call DBStore delete with correct parameters', async () => {
  const restore = idbAdapter.getDBTransaction;
  const deleteMock = jest.fn().mockImplementation(() => {
    return new Promise(resolve => {
      resolve();
    });
  });
  idbAdapter.getDBTransaction = jest.fn().mockImplementation(() => ({
    objectStore: () => ({
      delete: deleteMock
    })
  }));
  await idbAdapter.removeUser();
  expect(deleteMock).toHaveBeenCalled();
  expect(deleteMock).toHaveBeenCalledWith('username');
  idbAdapter.getDBTransaction = restore;
});
