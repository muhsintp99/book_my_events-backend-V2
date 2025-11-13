function makeError(message) {
  return {
    message: message || "Something went wrong",
  };
}

function makeJuspayResponse(rsp) {
  if (!rsp) return rsp;
  if (rsp.http) delete rsp.http;
  return rsp;
}

module.exports = { makeError, makeJuspayResponse };
