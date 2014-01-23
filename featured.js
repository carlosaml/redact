var acorn = require("acorn");
var _ = require('lodash');

function collectIfStatements(data, toggles) {
  function recurse(acc, value, key, collection) {
    if (isIfStatement(value) && isFeatureToggle(value, toggles)) {
      acc.push({name: value.test.property.name, toggled: toggles[value.test.property.name],
            start: value.consequent.start, end: value.consequent.end });
      return _.foldl([value.consequent], recurse, acc);
    } else if (_.has(value, "body")) {
      return _.foldl(value.body, recurse, acc);
    } else {
      return acc;
    }
  }
  return _.foldl([acorn.parse(data)], recurse, []);
}

function isIfStatement(node) {
  return _.has(node, "type") && node.type === "IfStatement";
}

function isFeatureToggle(ifStatement, toggles) {
  return _.has(ifStatement, "test") && 
         _.has(ifStatement.test, "property") &&
         _.contains(_.keys(toggles), ifStatement.test.property.name);
}

function redact(code, features) {
  var nextByte = 0;
  function recurse(redactedCode, value, index, features) {
    if (!value.toggled && value.start >= nextByte) {
      redactedCode += code.substring(nextByte, value.start) +
                      "{} // " + value.name + " redacted";
        nextByte = value.end;
    }
    return redactedCode;
  }
  return _.foldl(features, recurse, "") + code.substring(nextByte, code.length);
}

exports.collectIfStatements = collectIfStatements;
exports.isFeatureToggle = isFeatureToggle;
exports.isIfStatement = isIfStatement;
exports.redact = redact;