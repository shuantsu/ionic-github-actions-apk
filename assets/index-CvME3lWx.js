(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class StorageService {
  constructor() {
    this.STORAGE_KEY = "quick-notes";
    this.notes = [];
    this.loadNotes();
  }
  // Carregar notas do localStorage
  loadNotes() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.notes = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      this.notes = [];
    }
  }
  // Salvar notas no localStorage
  saveNotes() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes));
      return true;
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      return false;
    }
  }
  // Adicionar nova nota
  addNote(noteData) {
    const note = {
      id: Date.now().toString(),
      title: noteData.title || "Sem título",
      content: noteData.content || "",
      location: noteData.location || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.notes.unshift(note);
    this.saveNotes();
    return note;
  }
  // Atualizar nota existente
  updateNote(id, noteData) {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index !== -1) {
      this.notes[index] = {
        ...this.notes[index],
        ...noteData,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.saveNotes();
      return this.notes[index];
    }
    return null;
  }
  // Remover nota
  deleteNote(id) {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index !== -1) {
      const deleted = this.notes.splice(index, 1)[0];
      this.saveNotes();
      return deleted;
    }
    return null;
  }
  // Buscar nota por ID
  getNote(id) {
    return this.notes.find((note) => note.id === id) || null;
  }
  // Listar todas as notas
  getAllNotes() {
    return [...this.notes];
  }
  // Buscar notas por texto
  searchNotes(query) {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.getAllNotes();
    return this.notes.filter(
      (note) => note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm)
    );
  }
  // Limpar todas as notas
  clearAllNotes() {
    this.notes = [];
    this.saveNotes();
  }
  // Exportar notas
  exportNotes() {
    const dataStr = JSON.stringify(this.notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notes-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  // Importar notas
  importNotes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          if (Array.isArray(importedNotes)) {
            const existingIds = new Set(this.notes.map((n) => n.id));
            const newNotes = importedNotes.filter((note) => !existingIds.has(note.id));
            this.notes = [...newNotes, ...this.notes];
            this.saveNotes();
            resolve(newNotes.length);
          } else {
            reject("Formato inválido");
          }
        } catch (error) {
          reject("Erro ao ler arquivo");
        }
      };
      reader.onerror = () => reject("Erro ao ler arquivo");
      reader.readAsText(file);
    });
  }
}
const storage = new StorageService();
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
/*! Capacitor: https://capacitorjs.com/ - MIT License */
var ExceptionCode;
(function(ExceptionCode2) {
  ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
  ExceptionCode2["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException extends Error {
  constructor(message, code, data) {
    super(message);
    this.message = message;
    this.code = code;
    this.data = data;
  }
}
const getPlatformId = (win) => {
  var _a, _b;
  if (win === null || win === void 0 ? void 0 : win.androidBridge) {
    return "android";
  } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
    return "ios";
  } else {
    return "web";
  }
};
const createCapacitor = (win) => {
  const capCustomPlatform = win.CapacitorCustomPlatform || null;
  const cap = win.Capacitor || {};
  const Plugins = cap.Plugins = cap.Plugins || {};
  const getPlatform = () => {
    return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
  };
  const isNativePlatform = () => getPlatform() !== "web";
  const isPluginAvailable = (pluginName) => {
    const plugin = registeredPlugins.get(pluginName);
    if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
      return true;
    }
    if (getPluginHeader(pluginName)) {
      return true;
    }
    return false;
  };
  const getPluginHeader = (pluginName) => {
    var _a;
    return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
  };
  const handleError = (err) => win.console.error(err);
  const registeredPlugins = /* @__PURE__ */ new Map();
  const registerPlugin2 = (pluginName, jsImplementations = {}) => {
    const registeredPlugin = registeredPlugins.get(pluginName);
    if (registeredPlugin) {
      console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
      return registeredPlugin.proxy;
    }
    const platform = getPlatform();
    const pluginHeader = getPluginHeader(pluginName);
    let jsImplementation;
    const loadPluginImplementation = async () => {
      if (!jsImplementation && platform in jsImplementations) {
        jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
      } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
        jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
      }
      return jsImplementation;
    };
    const createPluginMethod = (impl, prop) => {
      var _a, _b;
      if (pluginHeader) {
        const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
        if (methodHeader) {
          if (methodHeader.rtype === "promise") {
            return (options) => cap.nativePromise(pluginName, prop.toString(), options);
          } else {
            return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
          }
        } else if (impl) {
          return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
        }
      } else if (impl) {
        return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
      } else {
        throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
      }
    };
    const createPluginMethodWrapper = (prop) => {
      let remove;
      const wrapper = (...args) => {
        const p = loadPluginImplementation().then((impl) => {
          const fn = createPluginMethod(impl, prop);
          if (fn) {
            const p2 = fn(...args);
            remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
            return p2;
          } else {
            throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        });
        if (prop === "addListener") {
          p.remove = async () => remove();
        }
        return p;
      };
      wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
      Object.defineProperty(wrapper, "name", {
        value: prop,
        writable: false,
        configurable: false
      });
      return wrapper;
    };
    const addListener = createPluginMethodWrapper("addListener");
    const removeListener = createPluginMethodWrapper("removeListener");
    const addListenerNative = (eventName, callback) => {
      const call = addListener({ eventName }, callback);
      const remove = async () => {
        const callbackId = await call;
        removeListener({
          eventName,
          callbackId
        }, callback);
      };
      const p = new Promise((resolve) => call.then(() => resolve({ remove })));
      p.remove = async () => {
        console.warn(`Using addListener() without 'await' is deprecated.`);
        await remove();
      };
      return p;
    };
    const proxy = new Proxy({}, {
      get(_, prop) {
        switch (prop) {
          case "$$typeof":
            return void 0;
          case "toJSON":
            return () => ({});
          case "addListener":
            return pluginHeader ? addListenerNative : addListener;
          case "removeListener":
            return removeListener;
          default:
            return createPluginMethodWrapper(prop);
        }
      }
    });
    Plugins[pluginName] = proxy;
    registeredPlugins.set(pluginName, {
      name: pluginName,
      proxy,
      platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
    });
    return proxy;
  };
  if (!cap.convertFileSrc) {
    cap.convertFileSrc = (filePath) => filePath;
  }
  cap.getPlatform = getPlatform;
  cap.handleError = handleError;
  cap.isNativePlatform = isNativePlatform;
  cap.isPluginAvailable = isPluginAvailable;
  cap.registerPlugin = registerPlugin2;
  cap.Exception = CapacitorException;
  cap.DEBUG = !!cap.DEBUG;
  cap.isLoggingEnabled = !!cap.isLoggingEnabled;
  return cap;
};
const initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
const Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
const registerPlugin = Capacitor.registerPlugin;
class WebPlugin {
  constructor() {
    this.listeners = {};
    this.retainedEventArguments = {};
    this.windowListeners = {};
  }
  addListener(eventName, listenerFunc) {
    let firstListener = false;
    const listeners = this.listeners[eventName];
    if (!listeners) {
      this.listeners[eventName] = [];
      firstListener = true;
    }
    this.listeners[eventName].push(listenerFunc);
    const windowListener = this.windowListeners[eventName];
    if (windowListener && !windowListener.registered) {
      this.addWindowListener(windowListener);
    }
    if (firstListener) {
      this.sendRetainedArgumentsForEvent(eventName);
    }
    const remove = async () => this.removeListener(eventName, listenerFunc);
    const p = Promise.resolve({ remove });
    return p;
  }
  async removeAllListeners() {
    this.listeners = {};
    for (const listener in this.windowListeners) {
      this.removeWindowListener(this.windowListeners[listener]);
    }
    this.windowListeners = {};
  }
  notifyListeners(eventName, data, retainUntilConsumed) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      if (retainUntilConsumed) {
        let args = this.retainedEventArguments[eventName];
        if (!args) {
          args = [];
        }
        args.push(data);
        this.retainedEventArguments[eventName] = args;
      }
      return;
    }
    listeners.forEach((listener) => listener(data));
  }
  hasListeners(eventName) {
    var _a;
    return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
  }
  registerWindowListener(windowEventName, pluginEventName) {
    this.windowListeners[pluginEventName] = {
      registered: false,
      windowEventName,
      pluginEventName,
      handler: (event) => {
        this.notifyListeners(pluginEventName, event);
      }
    };
  }
  unimplemented(msg = "not implemented") {
    return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
  }
  unavailable(msg = "not available") {
    return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
  }
  async removeListener(eventName, listenerFunc) {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return;
    }
    const index = listeners.indexOf(listenerFunc);
    this.listeners[eventName].splice(index, 1);
    if (!this.listeners[eventName].length) {
      this.removeWindowListener(this.windowListeners[eventName]);
    }
  }
  addWindowListener(handle) {
    window.addEventListener(handle.windowEventName, handle.handler);
    handle.registered = true;
  }
  removeWindowListener(handle) {
    if (!handle) {
      return;
    }
    window.removeEventListener(handle.windowEventName, handle.handler);
    handle.registered = false;
  }
  sendRetainedArgumentsForEvent(eventName) {
    const args = this.retainedEventArguments[eventName];
    if (!args) {
      return;
    }
    delete this.retainedEventArguments[eventName];
    args.forEach((arg) => {
      this.notifyListeners(eventName, arg);
    });
  }
}
const encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
const decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb extends WebPlugin {
  async getCookies() {
    const cookies = document.cookie;
    const cookieMap = {};
    cookies.split(";").forEach((cookie) => {
      if (cookie.length <= 0)
        return;
      let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
      key = decode(key).trim();
      value = decode(value).trim();
      cookieMap[key] = value;
    });
    return cookieMap;
  }
  async setCookie(options) {
    try {
      const encodedKey = encode(options.key);
      const encodedValue = encode(options.value);
      const expires = `; expires=${(options.expires || "").replace("expires=", "")}`;
      const path = (options.path || "/").replace("path=", "");
      const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
      document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async deleteCookie(options) {
    try {
      document.cookie = `${options.key}=; Max-Age=0`;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearCookies() {
    try {
      const cookies = document.cookie.split(";") || [];
      for (const cookie of cookies) {
        document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
  async clearAllCookies() {
    try {
      await this.clearCookies();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
registerPlugin("CapacitorCookies", {
  web: () => new CapacitorCookiesPluginWeb()
});
const readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64String = reader.result;
    resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(blob);
});
const normalizeHttpHeaders = (headers = {}) => {
  const originalKeys = Object.keys(headers);
  const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
  const normalized = loweredKeys.reduce((acc, key, index) => {
    acc[key] = headers[originalKeys[index]];
    return acc;
  }, {});
  return normalized;
};
const buildUrlParams = (params, shouldEncode = true) => {
  if (!params)
    return null;
  const output = Object.entries(params).reduce((accumulator, entry) => {
    const [key, value] = entry;
    let encodedValue;
    let item;
    if (Array.isArray(value)) {
      item = "";
      value.forEach((str) => {
        encodedValue = shouldEncode ? encodeURIComponent(str) : str;
        item += `${key}=${encodedValue}&`;
      });
      item.slice(0, -1);
    } else {
      encodedValue = shouldEncode ? encodeURIComponent(value) : value;
      item = `${key}=${encodedValue}`;
    }
    return `${accumulator}&${item}`;
  }, "");
  return output.substr(1);
};
const buildRequestInit = (options, extra = {}) => {
  const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
  const headers = normalizeHttpHeaders(options.headers);
  const type = headers["content-type"] || "";
  if (typeof options.data === "string") {
    output.body = options.data;
  } else if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.data || {})) {
      params.set(key, value);
    }
    output.body = params.toString();
  } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
    const form = new FormData();
    if (options.data instanceof FormData) {
      options.data.forEach((value, key) => {
        form.append(key, value);
      });
    } else {
      for (const key of Object.keys(options.data)) {
        form.append(key, options.data[key]);
      }
    }
    output.body = form;
    const headers2 = new Headers(output.headers);
    headers2.delete("content-type");
    output.headers = headers2;
  } else if (type.includes("application/json") || typeof options.data === "object") {
    output.body = JSON.stringify(options.data);
  }
  return output;
};
class CapacitorHttpPluginWeb extends WebPlugin {
  /**
   * Perform an Http request given a set of options
   * @param options Options to build the HTTP request
   */
  async request(options) {
    const requestInit = buildRequestInit(options, options.webFetchExtra);
    const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
    const url = urlParams ? `${options.url}?${urlParams}` : options.url;
    const response = await fetch(url, requestInit);
    const contentType = response.headers.get("content-type") || "";
    let { responseType = "text" } = response.ok ? options : {};
    if (contentType.includes("application/json")) {
      responseType = "json";
    }
    let data;
    let blob;
    switch (responseType) {
      case "arraybuffer":
      case "blob":
        blob = await response.blob();
        data = await readBlobAsBase64(blob);
        break;
      case "json":
        data = await response.json();
        break;
      case "document":
      case "text":
      default:
        data = await response.text();
    }
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return {
      data,
      headers,
      status: response.status,
      url: response.url
    };
  }
  /**
   * Perform an Http GET request given a set of options
   * @param options Options to build the HTTP request
   */
  async get(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
  }
  /**
   * Perform an Http POST request given a set of options
   * @param options Options to build the HTTP request
   */
  async post(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
  }
  /**
   * Perform an Http PUT request given a set of options
   * @param options Options to build the HTTP request
   */
  async put(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
  }
  /**
   * Perform an Http PATCH request given a set of options
   * @param options Options to build the HTTP request
   */
  async patch(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
  }
  /**
   * Perform an Http DELETE request given a set of options
   * @param options Options to build the HTTP request
   */
  async delete(options) {
    return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
  }
}
registerPlugin("CapacitorHttp", {
  web: () => new CapacitorHttpPluginWeb()
});
var SystemBarsStyle;
(function(SystemBarsStyle2) {
  SystemBarsStyle2["Dark"] = "DARK";
  SystemBarsStyle2["Light"] = "LIGHT";
  SystemBarsStyle2["Default"] = "DEFAULT";
})(SystemBarsStyle || (SystemBarsStyle = {}));
var SystemBarType;
(function(SystemBarType2) {
  SystemBarType2["StatusBar"] = "StatusBar";
  SystemBarType2["NavigationBar"] = "NavigationBar";
})(SystemBarType || (SystemBarType = {}));
class SystemBarsPluginWeb extends WebPlugin {
  async setStyle() {
    this.unavailable("not available for web");
  }
  async setAnimation() {
    this.unavailable("not available for web");
  }
  async show() {
    this.unavailable("not available for web");
  }
  async hide() {
    this.unavailable("not available for web");
  }
}
registerPlugin("SystemBars", {
  web: () => new SystemBarsPluginWeb()
});
function s(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return new Proxy({}, {
          get(w, o) {
            return (c, p, r) => {
              const i = t.Capacitor.Plugins[n];
              if (i === void 0) {
                r(new Error(`Capacitor plugin ${n} not found`));
                return;
              }
              if (typeof i[o] != "function") {
                r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                return;
              }
              (async () => {
                try {
                  const a = await i[o](c);
                  p(a);
                } catch (a) {
                  r(a);
                }
              })();
            };
          }
        });
      }
    }
  );
}
function u(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return t.cordova.plugins[n];
      }
    }
  );
}
function f(t = false) {
  typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
}
const Geolocation = registerPlugin("Geolocation", {
  web: () => __vitePreload(() => import("./web-CiWMdW-N.js"), true ? [] : void 0, import.meta.url).then((m) => new m.GeolocationWeb())
});
f();
class GeolocationService {
  constructor() {
    this.isAvailable = false;
    this.lastLocation = null;
    this.checkAvailability();
  }
  // Verificar se geolocalização está disponível
  async checkAvailability() {
    try {
      if ("geolocation" in navigator) {
        this.isAvailable = true;
        return true;
      }
      const result = await Geolocation.checkPermissions();
      this.isAvailable = result.location === "granted" || result.location === "prompt";
      return this.isAvailable;
    } catch (error) {
      console.log("Geolocalização não disponível:", error);
      this.isAvailable = false;
      return false;
    }
  }
  // Obter localização atual
  async getCurrentLocation() {
    if (!this.isAvailable) {
      return this.getMockLocation();
    }
    try {
      if (window.Capacitor) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 1e4,
          maximumAge: 6e4
        });
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: "capacitor"
        };
        this.lastLocation = location;
        return location;
      }
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: "browser"
            };
            this.lastLocation = location;
            resolve(location);
          },
          (error) => {
            console.warn("Erro ao obter localização:", error);
            resolve(this.getMockLocation());
          },
          {
            enableHighAccuracy: true,
            timeout: 1e4,
            maximumAge: 6e4
          }
        );
      });
    } catch (error) {
      console.warn("Erro ao obter localização:", error);
      return this.getMockLocation();
    }
  }
  // Mock location para desenvolvimento/testes
  getMockLocation() {
    const mockLocations = [
      { latitude: -23.5505, longitude: -46.6333, city: "São Paulo" },
      { latitude: -22.9068, longitude: -43.1729, city: "Rio de Janeiro" },
      { latitude: -15.8267, longitude: -47.9218, city: "Brasília" },
      { latitude: -19.9167, longitude: -43.9345, city: "Belo Horizonte" },
      { latitude: -30.0346, longitude: -51.2177, city: "Porto Alegre" }
    ];
    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    return {
      ...randomLocation,
      accuracy: 10,
      timestamp: Date.now(),
      source: "mock",
      note: "Localização simulada para desenvolvimento"
    };
  }
  // Solicitar permissões (mobile)
  async requestPermissions() {
    try {
      if (window.Capacitor) {
        const result = await Geolocation.requestPermissions();
        this.isAvailable = result.location === "granted";
        return this.isAvailable;
      }
      return true;
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      return false;
    }
  }
  // Formatar localização para exibição
  formatLocation(location) {
    if (!location) return "Localização desconhecida";
    const { latitude, longitude, city, source } = location;
    if (city) {
      return `📍 ${city}`;
    }
    return `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
  // Obter endereço reverso (mock)
  async reverseGeocode(location) {
    const mockAddresses = {
      "-23.5505": "São Paulo, SP",
      "-22.9068": "Rio de Janeiro, RJ",
      "-15.8267": "Brasília, DF",
      "-19.9167": "Belo Horizonte, MG",
      "-30.0346": "Porto Alegre, RS"
    };
    const latKey = location.latitude.toFixed(4);
    return mockAddresses[latKey] || "Localização desconhecida";
  }
  // Calcular distância entre dois pontos (em km)
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    const R = 6371;
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  // Obter última localização cacheada
  getLastLocation() {
    return this.lastLocation;
  }
}
const geolocation = new GeolocationService();
class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.editingNote = null;
    this.setupShadowDOM();
  }
  setupShadowDOM() {
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .form-container {
          background: var(--ion-background-color);
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          padding: var(--app-spacing);
          margin-bottom: var(--app-spacing);
          box-shadow: var(--app-card-shadow);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .form-header h3 {
          margin: 0;
          color: var(--ion-color-primary);
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--ion-text-color);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          background: var(--ion-background-color);
          color: var(--ion-text-color);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--ion-color-primary);
          box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.2);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--app-border-radius);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
        }

        .btn-primary:hover {
          background: var(--ion-color-primary-shade);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--ion-color-secondary);
          color: var(--ion-color-secondary-contrast);
        }

        .btn-secondary:hover {
          background: var(--ion-color-secondary-shade);
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--ion-color-light);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--ion-text-color);
          margin-top: 0.5rem;
        }

        .location-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--ion-color-medium);
          font-size: 0.875rem;
        }

        .char-count {
          text-align: right;
          font-size: 0.75rem;
          color: var(--ion-color-medium);
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>

      <div class="form-container">
        <div class="form-header">
          <h3 id="form-title">📝 Nova Nota</h3>
          <button class="btn btn-secondary" id="close-btn">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <form id="note-form-element">
          <div class="form-group">
            <label for="note-title">Título</label>
            <input 
              type="text" 
              id="note-title" 
              placeholder="Digite um título..." 
              maxlength="100"
              required
            />
            <div class="char-count">
              <span id="title-count">0</span>/100
            </div>
          </div>

          <div class="form-group">
            <label for="note-content">Conteúdo</label>
            <textarea 
              id="note-content" 
              placeholder="Digite sua nota..." 
              maxlength="1000"
              required
            ></textarea>
            <div class="char-count">
              <span id="content-count">0</span>/1000
            </div>
          </div>

          <div id="location-section">
            <div class="location-loading" id="location-loading">
              <ion-icon name="locate"></ion-icon>
              Obtendo localização...
            </div>
            <div class="location-info" id="location-info" style="display: none;">
              <ion-icon name="location"></ion-icon>
              <span id="location-text">Localização não disponível</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn">
              <ion-icon name="close"></ion-icon>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" id="save-btn">
              <ion-icon name="save"></ion-icon>
              <span id="save-text">Salvar Nota</span>
            </button>
          </div>
        </form>
      </div>
    `;
  }
  connectedCallback() {
    this.setupEventListeners();
    this.updateCharCounts();
  }
  setupEventListeners() {
    const form = this.shadowRoot.getElementById("note-form-element");
    const titleInput = this.shadowRoot.getElementById("note-title");
    const contentInput = this.shadowRoot.getElementById("note-content");
    const closeBtn = this.shadowRoot.getElementById("close-btn");
    const cancelBtn = this.shadowRoot.getElementById("cancel-btn");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveNote();
    });
    titleInput.addEventListener("input", () => this.updateCharCounts());
    contentInput.addEventListener("input", () => this.updateCharCounts());
    closeBtn.addEventListener("click", () => this.hide());
    cancelBtn.addEventListener("click", () => this.hide());
    form.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.saveNote();
      }
    });
  }
  updateCharCounts() {
    const titleInput = this.shadowRoot.getElementById("note-title");
    const contentInput = this.shadowRoot.getElementById("note-content");
    const titleCount = this.shadowRoot.getElementById("title-count");
    const contentCount = this.shadowRoot.getElementById("content-count");
    titleCount.textContent = titleInput.value.length;
    contentCount.textContent = contentInput.value.length;
  }
  async show(note = null) {
    this.editingNote = note;
    this.style.display = "block";
    const formTitle = this.shadowRoot.getElementById("form-title");
    const saveText = this.shadowRoot.getElementById("save-text");
    const titleInput = this.shadowRoot.getElementById("note-title");
    const contentInput = this.shadowRoot.getElementById("note-content");
    if (note) {
      formTitle.textContent = "✏️ Editar Nota";
      saveText.textContent = "Atualizar Nota";
      titleInput.value = note.title;
      contentInput.value = note.content;
    } else {
      formTitle.textContent = "📝 Nova Nota";
      saveText.textContent = "Salvar Nota";
      titleInput.value = "";
      contentInput.value = "";
    }
    this.updateCharCounts();
    titleInput.focus();
    await this.updateLocation();
  }
  hide() {
    this.style.display = "none";
    this.editingNote = null;
    const form = this.shadowRoot.getElementById("note-form-element");
    form.reset();
    this.updateCharCounts();
  }
  async updateLocation() {
    const loadingEl = this.shadowRoot.getElementById("location-loading");
    const infoEl = this.shadowRoot.getElementById("location-info");
    const textEl = this.shadowRoot.getElementById("location-text");
    loadingEl.style.display = "flex";
    infoEl.style.display = "none";
    try {
      const location = await geolocation.getCurrentLocation();
      const locationText = geolocation.formatLocation(location);
      textEl.textContent = locationText;
      this.currentLocation = location;
    } catch (error) {
      textEl.textContent = "📍 Localização não disponível";
      this.currentLocation = null;
    } finally {
      loadingEl.style.display = "none";
      infoEl.style.display = "flex";
    }
  }
  async saveNote() {
    const titleInput = this.shadowRoot.getElementById("note-title");
    const contentInput = this.shadowRoot.getElementById("note-content");
    const noteData = {
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      location: this.currentLocation
    };
    if (!noteData.title || !noteData.content) {
      this.showMessage("Por favor, preencha todos os campos", "warning");
      return;
    }
    try {
      if (this.editingNote) {
        storage.updateNote(this.editingNote.id, noteData);
        this.showMessage("Nota atualizada com sucesso!", "success");
      } else {
        storage.addNote(noteData);
        this.showMessage("Nota criada com sucesso!", "success");
      }
      this.dispatchEvent(new CustomEvent("note-saved", {
        detail: { note: this.editingNote || noteData }
      }));
      this.hide();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      this.showMessage("Erro ao salvar nota", "error");
    }
  }
  showMessage(message, type = "info") {
    const toast = document.createElement("ion-toast");
    toast.message = message;
    toast.duration = 3e3;
    toast.position = "bottom";
    if (type === "success") {
      toast.color = "success";
    } else if (type === "error") {
      toast.color = "danger";
    } else if (type === "warning") {
      toast.color = "warning";
    }
    document.body.appendChild(toast);
    toast.present();
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3500);
  }
}
customElements.define("note-form", NoteForm);
class NoteList extends HTMLElement {
  constructor() {
    super();
    this.notes = [];
    this.filteredNotes = [];
    this.searchQuery = "";
    this.setupShadowDOM();
  }
  setupShadowDOM() {
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--app-spacing);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-container {
          flex: 1;
          min-width: 200px;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          background: var(--ion-background-color);
          color: var(--ion-text-color);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--ion-color-primary);
          box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.2);
        }

        .list-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .stats {
          font-size: 0.875rem;
          color: var(--ion-color-medium);
          padding: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: var(--app-border-radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary {
          background: var(--ion-color-secondary);
          color: var(--ion-color-secondary-contrast);
        }

        .btn-secondary:hover {
          background: var(--ion-color-secondary-shade);
          transform: translateY(-1px);
        }

        .btn-danger {
          background: var(--ion-color-danger);
          color: var(--ion-color-danger-contrast);
        }

        .btn-danger:hover {
          background: var(--ion-color-danger-shade);
          transform: translateY(-1px);
        }

        .notes-container {
          min-height: 200px;
        }

        .empty-state {
          text-align: center;
          padding: 3rem var(--app-spacing);
          color: var(--ion-color-medium);
        }

        .empty-state ion-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.4;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: var(--ion-text-color);
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        .search-results {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: var(--ion-color-light);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--ion-text-color);
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: var(--ion-color-medium);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ion-color-light);
          border-top: 2px solid var(--ion-color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sort-options {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .sort-btn {
          background: none;
          border: 1px solid var(--ion-border-color);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--ion-text-color);
          transition: all 0.2s ease;
        }

        .sort-btn:hover {
          background: var(--ion-color-light);
        }

        .sort-btn.active {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
          border-color: var(--ion-color-primary);
        }

        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            max-width: none;
          }

          .list-actions {
            justify-content: space-between;
          }

          .sort-options {
            flex-wrap: wrap;
          }
        }
      </style>

      <div class="list-header">
        <div class="search-container">
          <input 
            type="text" 
            class="search-input" 
            placeholder="🔍 Buscar notas..."
            id="search-input"
          />
        </div>
        
        <div class="list-actions">
          <div class="sort-options">
            <button class="sort-btn active" data-sort="date">Data</button>
            <button class="sort-btn" data-sort="title">Título</button>
          </div>
          
          <div class="stats" id="stats">
            <span id="note-count">0</span> notas
          </div>
          
          <div class="actions">
            <button class="btn btn-secondary" id="export-btn" title="Exportar notas">
              <ion-icon name="download-outline"></ion-icon>
            </button>
            <button class="btn btn-danger" id="clear-btn" title="Limpar todas">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="search-results" id="search-results" style="display: none;">
        <span id="search-text"></span>
      </div>

      <div class="notes-container" id="notes-container">
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>Nenhuma nota ainda</h3>
          <p>Clique no botão + para criar sua primeira nota</p>
        </div>
      </div>
    `;
  }
  connectedCallback() {
    this.setupEventListeners();
    this.loadNotes();
  }
  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById("search-input");
    const exportBtn = this.shadowRoot.getElementById("export-btn");
    const clearBtn = this.shadowRoot.getElementById("clear-btn");
    const sortBtns = this.shadowRoot.querySelectorAll(".sort-btn");
    searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      this.filterNotes();
    });
    exportBtn.addEventListener("click", () => this.exportNotes());
    clearBtn.addEventListener("click", () => this.clearAllNotes());
    sortBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        sortBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.sortNotes(btn.dataset.sort);
      });
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === "Escape" && this.searchQuery) {
        searchInput.value = "";
        this.searchQuery = "";
        this.filterNotes();
      }
    });
  }
  loadNotes() {
    this.notes = storage.getAllNotes();
    this.filteredNotes = [...this.notes];
    this.render();
  }
  filterNotes() {
    if (this.searchQuery.trim()) {
      this.filteredNotes = storage.searchNotes(this.searchQuery);
    } else {
      this.filteredNotes = [...this.notes];
    }
    this.render();
    this.updateSearchResults();
  }
  sortNotes(sortBy) {
    switch (sortBy) {
      case "date":
        this.filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "title":
        this.filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    this.render();
  }
  render() {
    const container = this.shadowRoot.getElementById("notes-container");
    const noteCount = this.shadowRoot.getElementById("note-count");
    noteCount.textContent = this.filteredNotes.length;
    if (this.filteredNotes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>${this.searchQuery ? "Nenhuma nota encontrada" : "Nenhuma nota ainda"}</h3>
          <p>${this.searchQuery ? "Tente buscar com outros termos" : "Clique no botão + para criar sua primeira nota"}</p>
        </div>
      `;
      return;
    }
    container.innerHTML = "";
    this.filteredNotes.forEach((note) => {
      const noteItem = document.createElement("note-item");
      noteItem.setNote(note);
      noteItem.addEventListener("edit-note", (e) => {
        this.dispatchEvent(new CustomEvent("edit-note", e.detail));
      });
      noteItem.addEventListener("note-deleted", (e) => {
        this.loadNotes();
      });
      container.appendChild(noteItem);
    });
  }
  updateSearchResults() {
    const searchResults = this.shadowRoot.getElementById("search-results");
    const searchText = this.shadowRoot.getElementById("search-text");
    if (this.searchQuery.trim()) {
      searchResults.style.display = "block";
      searchText.textContent = `${this.filteredNotes.length} resultado(s) para "${this.searchQuery}"`;
    } else {
      searchResults.style.display = "none";
    }
  }
  async exportNotes() {
    if (this.notes.length === 0) {
      this.showToast("Nenhuma nota para exportar", "warning");
      return;
    }
    try {
      storage.exportNotes();
      this.showToast("Notas exportadas com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao exportar notas:", error);
      this.showToast("Erro ao exportar notas", "danger");
    }
  }
  async clearAllNotes() {
    if (this.notes.length === 0) {
      this.showToast("Nenhuma nota para limpar", "warning");
      return;
    }
    const confirmed = await this.confirmClearAll();
    if (confirmed) {
      try {
        storage.clearAllNotes();
        this.loadNotes();
        this.showToast("Todas as notas foram excluídas", "success");
      } catch (error) {
        console.error("Erro ao limpar notas:", error);
        this.showToast("Erro ao limpar notas", "danger");
      }
    }
  }
  async confirmClearAll() {
    return new Promise((resolve) => {
      const alert = document.createElement("ion-alert");
      alert.header = "⚠️ Confirmar Limpeza";
      alert.message = `Tem certeza que deseja excluir todas as ${this.notes.length} notas? Esta ação não pode ser desfeita.`;
      alert.buttons = [
        {
          text: "Cancelar",
          role: "cancel",
          handler: () => {
            resolve(false);
          }
        },
        {
          text: "Excluir Tudo",
          role: "destructive",
          handler: () => {
            resolve(true);
          }
        }
      ];
      document.body.appendChild(alert);
      return alert.present();
    });
  }
  showToast(message, color = "primary") {
    const toast = document.createElement("ion-toast");
    toast.message = message;
    toast.duration = 3e3;
    toast.position = "bottom";
    toast.color = color;
    document.body.appendChild(toast);
    toast.present();
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3500);
  }
  refresh() {
    this.loadNotes();
  }
}
customElements.define("note-list", NoteList);
class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.note = null;
    this.setupShadowDOM();
  }
  setupShadowDOM() {
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .note-card {
          background: var(--ion-background-color);
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          padding: var(--app-spacing);
          margin-bottom: var(--app-spacing);
          box-shadow: var(--app-card-shadow);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .note-title {
          margin: 0;
          color: var(--ion-color-primary);
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.3;
          flex: 1;
          word-wrap: break-word;
        }

        .note-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .note-card:hover .note-actions {
          opacity: 1;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          border-radius: 4px;
          color: var(--ion-color-medium);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: var(--ion-color-light);
          color: var(--ion-text-color);
        }

        .action-btn.edit:hover {
          color: var(--ion-color-primary);
        }

        .action-btn.delete:hover {
          color: var(--ion-color-danger);
        }

        .note-content {
          margin: 0 0 1rem 0;
          line-height: 1.5;
          color: var(--ion-text-color);
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 150px;
          overflow-y: auto;
        }

        .note-content.expanded {
          max-height: none;
        }

        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--ion-color-medium);
          padding-top: 0.75rem;
          border-top: 1px solid var(--ion-border-color);
        }

        .note-dates {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .note-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .note-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .note-location:hover {
          color: var(--ion-color-primary);
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--ion-color-primary);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .expand-btn:hover {
          background: var(--ion-color-light);
        }

        @media (max-width: 768px) {
          .note-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .note-actions {
            opacity: 1;
            align-self: flex-end;
          }

          .note-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }

        /* Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-card {
          animation: slideIn 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .note-card.deleting {
          animation: shake 0.3s ease;
        }
      </style>

      <div class="note-card">
        <div class="note-header">
          <h3 class="note-title"></h3>
          <div class="note-actions">
            <button class="action-btn edit" title="Editar">
              <ion-icon name="create-outline"></ion-icon>
            </button>
            <button class="action-btn delete" title="Excluir">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>

        <div class="note-content"></div>
        
        <div class="note-meta">
          <div class="note-dates">
            <div class="note-date">
              <ion-icon name="time-outline"></ion-icon>
              <span class="created-date"></span>
            </div>
            <div class="note-date" id="updated-container" style="display: none;">
              <ion-icon name="refresh-outline"></ion-icon>
              <span class="updated-date"></span>
            </div>
          </div>
          
          <div class="note-location" style="display: none;">
            <ion-icon name="location-outline"></ion-icon>
            <span class="location-text"></span>
          </div>
        </div>
      </div>
    `;
  }
  connectedCallback() {
    this.setupEventListeners();
  }
  setupEventListeners() {
    const editBtn = this.shadowRoot.querySelector(".action-btn.edit");
    const deleteBtn = this.shadowRoot.querySelector(".action-btn.delete");
    const locationEl = this.shadowRoot.querySelector(".note-location");
    editBtn.addEventListener("click", () => this.editNote());
    deleteBtn.addEventListener("click", () => this.deleteNote());
    locationEl.addEventListener("click", () => this.showLocationDetails());
  }
  setNote(note) {
    this.note = note;
    this.render();
  }
  render() {
    if (!this.note) return;
    const card = this.shadowRoot.querySelector(".note-card");
    const titleEl = this.shadowRoot.querySelector(".note-title");
    const contentEl = this.shadowRoot.querySelector(".note-content");
    const createdDateEl = this.shadowRoot.querySelector(".created-date");
    const updatedDateEl = this.shadowRoot.querySelector(".updated-date");
    const locationEl = this.shadowRoot.querySelector(".note-location");
    const locationTextEl = this.shadowRoot.querySelector(".location-text");
    titleEl.textContent = this.note.title;
    contentEl.textContent = this.note.content;
    if (this.note.content.length > 200 && !this.shadowRoot.querySelector(".expand-btn")) {
      const expandBtn = document.createElement("button");
      expandBtn.className = "expand-btn";
      expandBtn.textContent = "Ver mais";
      expandBtn.addEventListener("click", () => this.toggleContent());
      contentEl.parentNode.insertBefore(expandBtn, contentEl.nextSibling);
    }
    createdDateEl.textContent = this.formatDate(this.note.createdAt);
    if (this.note.updatedAt && this.note.updatedAt !== this.note.createdAt) {
      const updatedDateContainer = this.shadowRoot.getElementById("updated-container");
      updatedDateContainer.style.display = "flex";
      updatedDateEl.textContent = this.formatDate(this.note.updatedAt);
    }
    if (this.note.location) {
      locationEl.style.display = "flex";
      locationTextEl.textContent = geolocation.formatLocation(this.note.location);
    }
    card.dataset.noteId = this.note.id;
  }
  toggleContent() {
    const contentEl = this.shadowRoot.querySelector(".note-content");
    const expandBtn = this.shadowRoot.querySelector(".expand-btn");
    contentEl.classList.toggle("expanded");
    expandBtn.textContent = contentEl.classList.contains("expanded") ? "Ver menos" : "Ver mais";
  }
  editNote() {
    this.dispatchEvent(new CustomEvent("edit-note", {
      detail: { note: this.note }
    }));
  }
  async deleteNote() {
    const card = this.shadowRoot.querySelector(".note-card");
    card.classList.add("deleting");
    const confirmed = await this.confirmDelete();
    if (confirmed) {
      try {
        storage.deleteNote(this.note.id);
        this.dispatchEvent(new CustomEvent("note-deleted", {
          detail: { noteId: this.note.id }
        }));
        card.style.opacity = "0";
        card.style.transform = "translateX(-100%)";
        setTimeout(() => {
          this.remove();
        }, 300);
      } catch (error) {
        console.error("Erro ao excluir nota:", error);
        this.showToast("Erro ao excluir nota", "danger");
      }
    } else {
      card.classList.remove("deleting");
    }
  }
  async confirmDelete() {
    return new Promise((resolve) => {
      const alert = document.createElement("ion-alert");
      alert.header = "Confirmar Exclusão";
      alert.message = "Tem certeza que deseja excluir esta nota?";
      alert.buttons = [
        {
          text: "Cancelar",
          role: "cancel",
          handler: () => resolve(false)
        },
        {
          text: "Excluir",
          role: "destructive",
          handler: () => resolve(true)
        }
      ];
      document.body.appendChild(alert);
      alert.present();
    });
  }
  showLocationDetails() {
    if (!this.note.location) return;
    const location = this.note.location;
    const locationText = geolocation.formatLocation(location);
    const alert = document.createElement("ion-alert");
    alert.header = "📍 Detalhes da Localização";
    alert.message = `
      <p><strong>Localização:</strong> ${locationText}</p>
      <p><strong>Fonte:</strong> ${this.getLocationSource(location.source)}</p>
      <p><strong>Precisão:</strong> ${location.accuracy ? location.accuracy.toFixed(1) + "m" : "N/A"}</p>
      <p><strong>Data:</strong> ${this.formatDate(location.timestamp)}</p>
    `;
    alert.buttons = ["OK"];
    document.body.appendChild(alert);
    alert.present();
  }
  getLocationSource(source) {
    const sources = {
      "capacitor": "GPS (Dispositivo)",
      "browser": "GPS (Navegador)",
      "mock": "Simulado (Desenvolvimento)"
    };
    return sources[source] || "Desconhecido";
  }
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : void 0
    });
  }
  showToast(message, color = "primary") {
    const toast = document.createElement("ion-toast");
    toast.message = message;
    toast.duration = 2e3;
    toast.position = "bottom";
    toast.color = color;
    document.body.appendChild(toast);
    toast.present();
  }
}
customElements.define("note-item", NoteItem);
const SplashScreen = registerPlugin("SplashScreen", {
  web: () => __vitePreload(() => import("./web-CmAdyrSH.js"), true ? [] : void 0, import.meta.url).then((m) => new m.SplashScreenWeb())
});
class NotesApp {
  constructor() {
    this.noteForm = null;
    this.noteList = null;
    this.isInitialized = false;
  }
  async init() {
    try {
      await SplashScreen.hide();
      this.setupComponents();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      await this.loadInitialData();
      await this.checkPermissions();
      this.isInitialized = true;
      console.log("📝 Notas Rápidas inicializado com sucesso!");
    } catch (error) {
      console.error("Erro ao inicializar app:", error);
      this.showError("Erro ao inicializar aplicativo");
    }
  }
  setupComponents() {
    this.noteForm = document.getElementById("note-form");
    this.noteList = document.getElementById("note-list");
    this.addNoteBtn = document.getElementById("add-note-btn");
    this.setupComponentEvents();
  }
  setupComponentEvents() {
    if (this.noteForm) {
      this.noteForm.addEventListener("note-saved", () => {
        this.noteList.refresh();
        this.showSuccess("Nota salva com sucesso!");
      });
    }
    if (this.noteList) {
      this.noteList.addEventListener("edit-note", (e) => {
        this.editNote(e.detail.note);
      });
    }
    if (this.addNoteBtn) {
      this.addNoteBtn.addEventListener("click", () => {
        this.showNoteForm();
      });
    }
  }
  setupEventListeners() {
    this.setupThemeDetection();
    this.setupConnectivityDetection();
    this.setupNavigationHandling();
  }
  setupThemeDetection() {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    darkModeQuery.addEventListener("change", (e) => {
      document.body.classList.toggle("dark", e.matches);
      this.showInfo(`Tema alterado para ${e.matches ? "escuro" : "claro"}`);
    });
    document.body.classList.toggle("dark", darkModeQuery.matches);
  }
  setupConnectivityDetection() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        this.showWarning("Você está offline. As notas serão salvas localmente.");
      } else {
        this.showSuccess("Conexão restaurada!");
      }
    };
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  }
  setupNavigationHandling() {
    window.addEventListener("beforeunload", (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      var _a, _b;
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        this.showNoteForm();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        (_a = this.noteList) == null ? void 0 : _a.exportNotes();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        (_b = this.noteList) == null ? void 0 : _b.clearAllNotes();
      }
    });
  }
  async loadInitialData() {
    try {
      const notes = storage.getAllNotes();
      console.log(`📋 ${notes.length} notas carregadas`);
      if (this.noteList) {
        this.noteList.refresh();
      }
      if (notes.length === 0) {
        setTimeout(() => {
          this.showInfo("Bem-vindo! Clique no botão + para criar sua primeira nota.");
        }, 1e3);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      this.showError("Erro ao carregar suas notas");
    }
  }
  async checkPermissions() {
    if (!window.Capacitor) {
      console.log("🌐 Rodando no navegador");
      return;
    }
    try {
      const hasLocation = await geolocation.checkAvailability();
      if (!hasLocation) {
        console.log("📍 Geolocalização não disponível");
      }
      console.log("📱 Rodando em dispositivo móvel");
    } catch (error) {
      console.log("❌ Erro ao verificar permissões:", error);
    }
  }
  showNoteForm(note = null) {
    if (this.noteForm) {
      this.noteForm.show(note);
    }
  }
  editNote(note) {
    this.showNoteForm(note);
  }
  hasUnsavedChanges() {
    var _a, _b;
    if (!this.noteForm) return false;
    const titleInput = (_a = this.noteForm.shadowRoot) == null ? void 0 : _a.getElementById("note-title");
    const contentInput = (_b = this.noteForm.shadowRoot) == null ? void 0 : _b.getElementById("note-content");
    if (!titleInput || !contentInput) return false;
    return titleInput.value.trim() || contentInput.value.trim();
  }
  // Métodos de notificação
  showSuccess(message) {
    this.showToast(message, "success");
  }
  showError(message) {
    this.showToast(message, "danger");
  }
  showWarning(message) {
    this.showToast(message, "warning");
  }
  showInfo(message) {
    this.showToast(message, "primary");
  }
  showToast(message, color = "primary") {
    const toast = document.createElement("ion-toast");
    toast.message = message;
    toast.duration = 3e3;
    toast.position = "bottom";
    toast.color = color;
    toast.swipeGesture = "vertical";
    document.body.appendChild(toast);
    toast.present();
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3500);
  }
  // Métodos utilitários
  async requestLocationPermission() {
    try {
      const granted = await geolocation.requestPermissions();
      if (granted) {
        this.showSuccess("Permissão de localização concedida!");
      } else {
        this.showWarning("Permissão de localização negada");
      }
      return granted;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      this.showError("Erro ao solicitar permissão de localização");
      return false;
    }
  }
  // Debug e desenvolvimento
  enableDebugMode() {
    window.notesApp = this;
    window.storage = storage;
    window.geolocation = geolocation;
    console.log("🐛 Debug mode enabled!");
    console.log("Available commands:");
    console.log("- notesApp: App instance");
    console.log("- storage: Storage service");
    console.log("- geolocation: Geolocation service");
    console.log("- storage.getAllNotes(): List all notes");
    console.log("- storage.clearAllNotes(): Clear all notes");
  }
  // Performance monitoring
  logPerformance() {
    if ("performance" in window) {
      const perfData = performance.getEntriesByType("navigation")[0];
      console.log("📊 Performance metrics:");
      console.log(`- Load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
      console.log(`- DOM interactive: ${perfData.domInteractive - perfData.loadEventStart}ms`);
    }
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  const app = new NotesApp();
  await app.init();
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    app.enableDebugMode();
    app.logPerformance();
  }
  window.NotesApp = NotesApp;
  window.app = app;
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  console.log("📱 PWA install prompt available");
});
window.addEventListener("appinstalled", () => {
  console.log("📱 PWA installed successfully!");
  if (window.app) {
    window.app.showSuccess("App instalado com sucesso!");
  }
});
export {
  WebPlugin as W
};
