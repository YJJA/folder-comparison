'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.md5File = exports.unzipFile = exports.applyDirctory = exports.diffDirctory = exports.parseDirctory = exports.patchesToZip = exports.NORMAL = exports.DELETE = exports.UPDATE = exports.INSERT = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// 生成压缩补丁文件
var patchesToZip = exports.patchesToZip = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(zipPath, patches) {
    var zipMd5;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _fsPromise2.default.mkdirs(_path2.default.dirname(zipPath));

          case 2:
            _context2.next = 4;
            return new _promise2.default(function (resolve, reject) {
              var archive = (0, _archiver2.default)('zip', { store: true });
              var output = _fs2.default.createWriteStream(zipPath);

              archive.on('error', function (err) {
                return reject(err);
              });
              output.on('error', function (err) {
                return reject(err);
              });
              output.on('close', function () {
                return resolve();
              });

              var updateJson = patches.map(function (update) {
                var action = update.action,
                    name = update.name,
                    patch = update.patch,
                    path = update.path;
                // 新增

                if (action === INSERT) {
                  archive.file(path, { name: name });
                }
                // 更新
                if (action === UPDATE) {
                  archive.append(patch, { name: name });
                }

                // 删除 / 正常
                return { action: action, name: name };
              });

              archive.append((0, _stringify2.default)(updateJson), { name: 'update.json' });
              archive.pipe(output);
              archive.finalize();
            });

          case 4:
            _context2.next = 6;
            return md5File(zipPath);

          case 6:
            zipMd5 = _context2.sent;
            _context2.next = 9;
            return _fsPromise2.default.outputFile(zipPath + '.md5', zipMd5, 'utf8');

          case 9:
            return _context2.abrupt('return', zipPath);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function patchesToZip(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

// 文件夹解析


var parseDirctory = exports.parseDirctory = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(parentpath) {
    var _this = this;

    var filename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var fullpath, children, childrenPromise, childpaths;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            fullpath = _path2.default.join(parentpath, filename);
            _context4.next = 3;
            return _fsPromise2.default.readdir(fullpath);

          case 3:
            children = _context4.sent;
            childrenPromise = children.map(function () {
              var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(child) {
                var childname, childpath, stat;
                return _regenerator2.default.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        childname = _path2.default.join(filename, child);
                        childpath = _path2.default.join(parentpath, childname);
                        _context3.next = 4;
                        return _fsPromise2.default.stat(childpath);

                      case 4:
                        stat = _context3.sent;

                        if (!stat.isFile()) {
                          _context3.next = 7;
                          break;
                        }

                        return _context3.abrupt('return', { path: childpath, name: childname });

                      case 7:
                        if (!stat.isDirectory()) {
                          _context3.next = 11;
                          break;
                        }

                        _context3.next = 10;
                        return parseDirctory(parentpath, childname);

                      case 10:
                        return _context3.abrupt('return', _context3.sent);

                      case 11:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, _this);
              }));

              return function (_x8) {
                return _ref4.apply(this, arguments);
              };
            }());
            _context4.next = 7;
            return _promise2.default.all(childrenPromise);

          case 7:
            childpaths = _context4.sent;
            return _context4.abrupt('return', childpaths.reduce(function (arr, child) {
              return arr.concat(child);
            }, []));

          case 9:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function parseDirctory(_x6) {
    return _ref3.apply(this, arguments);
  };
}();

// 文件夹对比


var diffDirctory = exports.diffDirctory = function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(original, freshly) {
    var _this2 = this;

    var _ref6, _ref7, oFiles, fFiles, fileExt, diffPromise, patches;

    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return _promise2.default.all([parseDirctory(original), parseDirctory(freshly)]);

          case 2:
            _ref6 = _context6.sent;
            _ref7 = (0, _slicedToArray3.default)(_ref6, 2);
            oFiles = _ref7[0];
            fFiles = _ref7[1];

            // 可增量文件后缀
            fileExt = ['.jsbundle', '.js', '.css'];
            diffPromise = fFiles.map(function () {
              var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(fFile) {
                var oFile, _ref9, _ref10, fFileText, oFileText, patchText;

                return _regenerator2.default.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        oFile = includesFile(oFiles, fFile.name);
                        // 新文件在原文件夹中没有找到的进行新增操作

                        if (oFile) {
                          _context5.next = 3;
                          break;
                        }

                        return _context5.abrupt('return', { action: INSERT, name: fFile.name, path: fFile.path });

                      case 3:

                        // 标记已匹配到的文件
                        oFile.isFound = true;
                        // 新文件在原文件夹中已找到， 对比文件MD5值
                        _context5.next = 6;
                        return _promise2.default.all([_fsPromise2.default.readFile(fFile.path, 'utf8'), _fsPromise2.default.readFile(oFile.path, 'utf8')]);

                      case 6:
                        _ref9 = _context5.sent;
                        _ref10 = (0, _slicedToArray3.default)(_ref9, 2);
                        fFileText = _ref10[0];
                        oFileText = _ref10[1];

                        if (!((0, _md2.default)(fFileText) !== (0, _md2.default)(oFileText))) {
                          _context5.next = 17;
                          break;
                        }

                        if (!fileExt.includes(_path2.default.extname(fFile.name))) {
                          _context5.next = 16;
                          break;
                        }

                        patchText = patchToText(oFileText, fFileText);
                        return _context5.abrupt('return', { action: UPDATE, name: fFile.name, patch: patchText });

                      case 16:
                        return _context5.abrupt('return', { action: INSERT, name: fFile.name, path: fFile.path });

                      case 17:
                        return _context5.abrupt('return', { action: NORMAL, name: fFile.name });

                      case 18:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this2);
              }));

              return function (_x11) {
                return _ref8.apply(this, arguments);
              };
            }());
            _context6.next = 10;
            return _promise2.default.all(diffPromise);

          case 10:
            patches = _context6.sent;

            // 没有匹配的旧资源将全部进行删除操作
            oFiles.forEach(function (oFile) {
              if (!oFile.isFound) {
                patches.push({ action: DELETE, name: oFile.name });
              }
            });
            return _context6.abrupt('return', patches);

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function diffDirctory(_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}();

// 文件还原操作


var applyDirctory = exports.applyDirctory = function () {
  var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(original, patches, dist) {
    var _this3 = this;

    var patchesDist, updateJsonPath, updateJson, uptatePromise, updateResult;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            // 文件夹解压
            patchesDist = patches.replace(/\.zip$/, '');
            _context8.next = 3;
            return unzipFile(patches, patchesDist);

          case 3:
            // 读取 update.json 文件
            updateJsonPath = _path2.default.join(patchesDist, 'update.json');
            _context8.next = 6;
            return _fsPromise2.default.readJson(updateJsonPath);

          case 6:
            updateJson = _context8.sent;
            _context8.next = 9;
            return _fsPromise2.default.mkdirs(dist);

          case 9:
            uptatePromise = updateJson.map(function () {
              var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(update) {
                var name, action, filepath, target, originalpath, patchText, originalText, freshlyText;
                return _regenerator2.default.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        name = update.name, action = update.action;
                        filepath = _path2.default.join(patchesDist, name);
                        target = _path2.default.join(dist, name);
                        originalpath = _path2.default.join(original, name);

                        // 插入 直接将增量包中的文件 复制 到dist

                        if (!(action === INSERT)) {
                          _context7.next = 8;
                          break;
                        }

                        _context7.next = 7;
                        return _fsPromise2.default.copy(filepath, target);

                      case 7:
                        return _context7.abrupt('return', update);

                      case 8:
                        if (!(action === UPDATE)) {
                          _context7.next = 21;
                          break;
                        }

                        _context7.next = 11;
                        return _fsPromise2.default.readFile(filepath, 'utf8');

                      case 11:
                        patchText = _context7.sent;
                        _context7.next = 14;
                        return _fsPromise2.default.readFile(originalpath, 'utf8');

                      case 14:
                        originalText = _context7.sent;
                        freshlyText = applyToText(originalText, patchText);

                        if (freshlyText) {
                          _context7.next = 18;
                          break;
                        }

                        throw new Error('文件还原操作发生错误 ' + name);

                      case 18:
                        _context7.next = 20;
                        return _fsPromise2.default.outputFile(target, new Buffer(freshlyText), 'utf8');

                      case 20:
                        return _context7.abrupt('return', update);

                      case 21:
                        if (!(action === DELETE)) {
                          _context7.next = 23;
                          break;
                        }

                        return _context7.abrupt('return', update);

                      case 23:
                        _context7.next = 25;
                        return _fsPromise2.default.copy(originalpath, target);

                      case 25:
                        return _context7.abrupt('return', update);

                      case 26:
                      case 'end':
                        return _context7.stop();
                    }
                  }
                }, _callee7, _this3);
              }));

              return function (_x15) {
                return _ref12.apply(this, arguments);
              };
            }());
            _context8.next = 12;
            return _promise2.default.all(uptatePromise);

          case 12:
            updateResult = _context8.sent;
            _context8.next = 15;
            return _fsPromise2.default.remove(patchesDist);

          case 15:
            return _context8.abrupt('return', updateResult);

          case 16:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function applyDirctory(_x12, _x13, _x14) {
    return _ref11.apply(this, arguments);
  };
}();

// 文件解压


var unzipFile = exports.unzipFile = function () {
  var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(src, dist) {
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return _fsPromise2.default.mkdirs(dist);

          case 2:
            _context9.next = 4;
            return new _promise2.default(function (resolve, reject) {
              _fs2.default.createReadStream(src).pipe(_unzip2.default.Extract({ path: dist })).on('error', function (err) {
                return reject(err);
              }).on('close', function () {
                return resolve(dist);
              });
            });

          case 4:
            return _context9.abrupt('return', dist);

          case 5:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function unzipFile(_x16, _x17) {
    return _ref13.apply(this, arguments);
  };
}();

// 文件 MD5


var md5File = exports.md5File = function () {
  var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(filepath) {
    var buf;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return _fsPromise2.default.readFile(filepath);

          case 2:
            buf = _context10.sent;
            return _context10.abrupt('return', (0, _md2.default)(buf));

          case 4:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function md5File(_x18) {
    return _ref14.apply(this, arguments);
  };
}();

// 数据查找


var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsPromise = require('fs-promise');

var _fsPromise2 = _interopRequireDefault(_fsPromise);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _unzip = require('unzip2');

var _unzip2 = _interopRequireDefault(_unzip);

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _diffMatchPatch = require('diff-match-patch');

var _diffMatchPatch2 = _interopRequireDefault(_diffMatchPatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var INSERT = exports.INSERT = 'insert'; // 新增
var UPDATE = exports.UPDATE = 'update'; // 更新
var DELETE = exports.DELETE = 'delete'; // 删除
var NORMAL = exports.NORMAL = 'normal'; // 正常

// 文件夹对比，并生成增量补订

exports.default = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(original, freshly, zipPath) {
    var patches;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return diffDirctory(original, freshly);

          case 2:
            patches = _context.sent;
            _context.next = 5;
            return patchesToZip(zipPath, patches);

          case 5:
            return _context.abrupt('return', _context.sent);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function comparison(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  }

  return comparison;
}();

function includesFile(files, name) {
  for (var i = 0; i < files.length; i++) {
    if (files[i].name === name) {
      return files[i];
    }
  }
}

var diff = new _diffMatchPatch2.default();

// 文本对比
function patchToText(originalText, freshlyText) {
  var patches = diff.patch_make(originalText, freshlyText);
  return diff.patch_toText(patches);
}

// 文本还原
function applyToText(originalText, patchText) {
  var patch = diff.patch_fromText(patchText);

  var _diff$patch_apply = diff.patch_apply(patch, originalText),
      _diff$patch_apply2 = (0, _slicedToArray3.default)(_diff$patch_apply, 2),
      freshlyText = _diff$patch_apply2[0],
      isSuccess = _diff$patch_apply2[1];

  if (isSuccess) return freshlyText;
}