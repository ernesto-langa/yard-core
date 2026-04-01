# Guía de Hardening de Seguridad de YARD

> [EN](../../guides/security-hardening.md) | [PT](../../pt/guides/security-hardening.md) | **ES**

---

> Guía completa para fortalecer la seguridad en despliegues de Synkra YARD - desde desarrollo hasta producción.

**Versión:** 2.1.0
**Última Actualización:** 2026-01-29

---

## Tabla de Contenidos

1. [Visión General de Seguridad](#visión-general-de-seguridad)
2. [Gestión de Claves API](#gestión-de-claves-api)
3. [Variables de Entorno y Secretos](#variables-de-entorno-y-secretos)
4. [Permisos de Archivos y Directorios](#permisos-de-archivos-y-directorios)
5. [Sandboxing y Aislamiento](#sandboxing-y-aislamiento)
6. [Validación de Entrada](#validación-de-entrada)
7. [Protección contra Inyección](#protección-contra-inyección)
8. [Logging y Auditoría](#logging-y-auditoría)
9. [Configuración de Producción vs Desarrollo](#configuración-de-producción-vs-desarrollo)
10. [Lista de Verificación de Seguridad](#lista-de-verificación-de-seguridad)
11. [Reporte de Vulnerabilidades](#reporte-de-vulnerabilidades)

---

## Visión General de Seguridad

Synkra YARD opera en una capa privilegiada entre los modelos de IA y tu sistema. Esta guía cubre estrategias de hardening específicas para entornos de desarrollo orquestados por IA.

### Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA EXTERNA                              │
│    Network Firewall | WAF | TLS Termination | Rate Limiting     │
├─────────────────────────────────────────────────────────────────┤
│                      CAPA DE APLICACIÓN                          │
│   Permission Modes | Input Validation | Command Sanitization    │
├─────────────────────────────────────────────────────────────────┤
│                       CAPA DE EJECUCIÓN                          │
│    Sandboxing | Process Isolation | Resource Limits | Hooks     │
├─────────────────────────────────────────────────────────────────┤
│                         CAPA DE DATOS                            │
│   Encryption at Rest | Secure Storage | Audit Logging           │
└─────────────────────────────────────────────────────────────────┘
```

### Preocupaciones de Seguridad Específicas de YARD

| Preocupación                   | Nivel de Riesgo | Mitigación                        |
| ------------------------------ | --------------- | --------------------------------- |
| Ejecución de código de agentes | CRÍTICO         | Permission Modes, Sandboxing      |
| Exposición de claves API       | CRÍTICO         | Aislamiento de entorno, cifrado   |
| Inyección de comandos vía IA   | ALTO            | Sanitización de entrada, hooks    |
| Acceso no autorizado a archivos| ALTO            | Restricciones de directorio       |
| Secuestro de sesión            | MEDIO           | Rotación de tokens, almacenamiento seguro |
| Divulgación de información     | MEDIO           | Audit logging, controles de acceso|

### Defensa en Profundidad

YARD implementa múltiples capas de protección:

1. **Permission Modes** - Controlan la autonomía del agente (Explore/Ask/Auto)
2. **Claude Hooks** - Validación previa a la ejecución (read-protection, sql-governance)
3. **Sanitización de Entrada** - Toda entrada de usuario/IA es validada
4. **Aislamiento de Procesos** - Los servidores MCP se ejecutan en contenedores
5. **Audit Logging** - Todas las operaciones son registradas

---

## Gestión de Claves API

Las claves API son los secretos más críticos en YARD. Las claves comprometidas pueden llevar a uso no autorizado, brechas de datos e impacto financiero significativo.

### Jerarquía de Almacenamiento

```
┌────────────────────────────────────────────────────────────────┐
│  NUNCA                                                          │
│  ❌ Código fuente                                               │
│  ❌ Repositorios Git                                            │
│  ❌ Archivos de configuración (commiteados)                     │
│  ❌ Archivos de log                                             │
│  ❌ Mensajes de error                                           │
├────────────────────────────────────────────────────────────────┤
│  ACEPTABLE (Desarrollo)                                         │
│  ⚠️  Archivos .env (gitignored)                                 │
│  ⚠️  Variables de entorno locales                               │
├────────────────────────────────────────────────────────────────┤
│  RECOMENDADO (Producción)                                       │
│  ✅ Secret managers (Vault, AWS Secrets, etc.)                  │
│  ✅ Inyección de secretos en CI/CD                              │
│  ✅ Kubernetes secrets                                          │
│  ✅ Almacenes de credenciales cifrados                          │
└────────────────────────────────────────────────────────────────┘
```

### Configuración Segura de Claves API

**Desarrollo (archivo .env - nunca commitear)**

```bash
# .env - Agregar a .gitignore INMEDIATAMENTE
# Claves de Proveedores de API
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Claves de Servidores MCP
EXA_API_KEY=exa-xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxx

# Nunca usar valores predeterminados o débiles
JWT_SECRET=your-256-bit-cryptographically-secure-random-key
```

**Producción (usando secret manager)**

```javascript
// Cargar secretos desde vault seguro
const secrets = await SecretManager.loadSecrets({
  provider: 'aws-secrets-manager', // o 'hashicorp-vault', 'gcp-secrets'
  secretName: 'yard/production/api-keys',
  region: process.env.AWS_REGION,
});

process.env.ANTHROPIC_API_KEY = secrets.ANTHROPIC_API_KEY;
process.env.OPENAI_API_KEY = secrets.OPENAI_API_KEY;
```

### Política de Rotación de Claves

| Tipo de Clave      | Frecuencia de Rotación | En Caso de Compromiso |
| ------------------ | ---------------------- | --------------------- |
| Claves de Proveedores AI | 90 días           | Inmediato             |
| JWT Secrets        | 30 días                | Inmediato             |
| Claves de Servidores MCP | 90 días           | Inmediato             |
| Tokens de Servicio | 7 días                 | Inmediato             |
| Claves de Desarrollo | Nunca reutilizar     | Revocar inmediatamente|

### Validación de Claves al Iniciar

```javascript
// .yard-core/core/security/key-validator.js
const requiredKeys = [
  { name: 'ANTHROPIC_API_KEY', pattern: /^sk-ant-[a-zA-Z0-9_-]+$/ },
  { name: 'JWT_SECRET', minLength: 32 },
];

function validateApiKeys() {
  const errors = [];

  for (const key of requiredKeys) {
    const value = process.env[key.name];

    if (!value) {
      errors.push(`Clave requerida faltante: ${key.name}`);
      continue;
    }

    if (key.pattern && !key.pattern.test(value)) {
      errors.push(`Formato inválido para ${key.name}`);
    }

    if (key.minLength && value.length < key.minLength) {
      errors.push(`${key.name} debe tener al menos ${key.minLength} caracteres`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validación de Clave API Fallida:\n${errors.join('\n')}`);
  }
}
```

---

## Variables de Entorno y Secretos

### Plantilla de Archivo .env Seguro

```bash
# ============================================================
# CONFIGURACIÓN DE ENTORNO YARD
# ============================================================
# SEGURIDAD: Este archivo NUNCA debe ser commiteado a control de versiones
# Agregar a .gitignore: .env, .env.local, .env.*.local
# ============================================================

# ------------------------------------------------------------
# ENTORNO
# ------------------------------------------------------------
NODE_ENV=development
YARD_DEBUG=false
LOG_LEVEL=info

# ------------------------------------------------------------
# CONFIGURACIÓN DE PROVEEDOR AI
# ------------------------------------------------------------
# Proveedor principal
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=

# Proveedor de respaldo (opcional)
OPENAI_API_KEY=

# ------------------------------------------------------------
# AUTENTICACIÓN Y SESIÓN
# ------------------------------------------------------------
# Generar con: openssl rand -hex 32
JWT_SECRET=
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Configuración de sesión
SESSION_SECRET=
SESSION_TIMEOUT=3600000

# ------------------------------------------------------------
# CIFRADO
# ------------------------------------------------------------
# Generar con: openssl rand -hex 32
DATABASE_ENCRYPTION_KEY=
FILE_ENCRYPTION_KEY=

# ------------------------------------------------------------
# SERVIDORES MCP
# ------------------------------------------------------------
# EXA Web Search
EXA_API_KEY=

# Integración GitHub
GITHUB_TOKEN=

# Apify Web Scraping
APIFY_TOKEN=

# ------------------------------------------------------------
# CONFIGURACIÓN DE SEGURIDAD
# ------------------------------------------------------------
# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS (solo producción)
CORS_ORIGIN=https://your-domain.com

# Content Security Policy
CSP_ENABLED=true

# ------------------------------------------------------------
# AUDITORÍA Y LOGGING
# ------------------------------------------------------------
AUDIT_LOG_ENABLED=true
AUDIT_LOG_PATH=/var/log/yard/audit.log
AUDIT_LOG_RETENTION_DAYS=90
```

### Protección de Archivos de Secretos

```bash
# Crear directorio seguro para secretos
mkdir -p ~/.yard/secrets
chmod 700 ~/.yard/secrets

# Crear archivo de secretos cifrado
# Nunca almacenar secretos en texto plano
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in secrets.txt \
  -out ~/.yard/secrets/encrypted.dat

# Establecer permisos apropiados
chmod 600 ~/.yard/secrets/*

# Verificar que no hay secretos en el historial de git
git log -p --all -S "API_KEY" -- .
```

### Aislamiento de Entorno

```javascript
// Validar aislamiento de entorno
function validateEnvironment() {
  // Asegurar que los secretos de producción no se usen en desarrollo
  if (process.env.NODE_ENV === 'development') {
    if (process.env.ANTHROPIC_API_KEY?.includes('prod')) {
      throw new Error('Clave API de producción detectada en entorno de desarrollo');
    }
  }

  // Asegurar que el modo debug esté desactivado en producción
  if (process.env.NODE_ENV === 'production') {
    if (process.env.YARD_DEBUG === 'true') {
      console.warn('ADVERTENCIA: Modo debug habilitado en producción');
    }
  }
}
```

---

## Permisos de Archivos y Directorios

### Permisos de Estructura de Directorios YARD

```bash
# ============================================================
# PERMISOS RECOMENDADOS
# ============================================================

# Raíz del proyecto (estándar)
chmod 755 /path/to/project

# Directorios de configuración YARD
chmod 700 .yard/              # Solo el propietario puede acceder
chmod 700 .yard-core/         # Fuente del framework
chmod 700 .claude/            # Configuración de Claude

# Archivos de configuración sensibles
chmod 600 .env                # Variables de entorno
chmod 600 .yard/config.yaml   # Configuración principal
chmod 600 .yard/users.json    # Base de datos de usuarios
chmod 600 .yard/sessions.json # Sesiones activas

# Directorio de secretos
chmod 700 ~/.yard/secrets/
chmod 600 ~/.yard/secrets/*

# Archivos de log
chmod 640 logs/*.log          # Propietario lectura/escritura, grupo lectura
chmod 750 logs/               # Propietario completo, grupo lectura/ejecución

# Archivos temporales
chmod 700 .yard/temp/
chmod 600 .yard/temp/*
```

### Control de Acceso a Directorios

```yaml
# .yard/config.yaml - Configuración de directorios permitidos
security:
  allowedDirectories:
    read:
      - '${PROJECT_ROOT}'
      - '${HOME}/.yard'
    write:
      - '${PROJECT_ROOT}/src'
      - '${PROJECT_ROOT}/docs'
      - '${PROJECT_ROOT}/tests'
    execute:
      - '${PROJECT_ROOT}/scripts'
      - '${PROJECT_ROOT}/node_modules/.bin'

  blockedPaths:
    - '/etc'
    - '/var'
    - '/usr'
    - '${HOME}/.ssh'
    - '${HOME}/.gnupg'
    - '${HOME}/.aws'
```

### Script de Validación de Permisos

```bash
#!/bin/bash
# scripts/check-permissions.sh

echo "Verificación de Permisos de Seguridad YARD"
echo "==========================================="

# Verificar archivos críticos
check_permission() {
  local file=$1
  local expected=$2
  local actual=$(stat -f "%Lp" "$file" 2>/dev/null || stat -c "%a" "$file" 2>/dev/null)

  if [ "$actual" != "$expected" ]; then
    echo "ADVERTENCIA: $file tiene permisos $actual, se esperaba $expected"
    return 1
  else
    echo "OK: $file ($actual)"
    return 0
  fi
}

# Verificar archivos críticos
check_permission ".env" "600"
check_permission ".yard" "700"
check_permission ".yard/config.yaml" "600"

# Verificar archivos sensibles legibles por todos
find . -name "*.key" -o -name "*.pem" -o -name "*.env*" | while read f; do
  perms=$(stat -f "%Lp" "$f" 2>/dev/null || stat -c "%a" "$f" 2>/dev/null)
  if [ "${perms: -1}" != "0" ]; then
    echo "CRÍTICO: ¡$f es legible por todos!"
  fi
done

echo ""
echo "Verificación de permisos completada."
```

---

## Sandboxing y Aislamiento

### Aislamiento de MCP con Docker

YARD usa contenedores Docker para aislar los servidores MCP del sistema host:

```
┌─────────────────────────────────────────────────────────────┐
│                      SISTEMA HOST                            │
│                                                              │
│  ┌────────────────┐    ┌────────────────────────────────┐  │
│  │  Claude Code   │    │      Contenedor Docker         │  │
│  │                │    │  ┌──────────────────────────┐  │  │
│  │  ┌──────────┐  │    │  │  docker-gateway          │  │  │
│  │  │ Native   │  │◄──►│  │  ┌─────┐ ┌─────────┐    │  │  │
│  │  │ Tools    │  │    │  │  │ EXA │ │Context7 │    │  │  │
│  │  └──────────┘  │    │  │  └─────┘ └─────────┘    │  │  │
│  │                │    │  │  ┌─────────┐            │  │  │
│  │  ┌──────────┐  │    │  │  │  Apify  │            │  │  │
│  │  │Playwright│  │    │  │  └─────────┘            │  │  │
│  │  └──────────┘  │    │  └──────────────────────────┘  │  │
│  └────────────────┘    └────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Configuración de Seguridad de Contenedores

```yaml
# docker-compose.security.yml
version: '3.8'

services:
  mcp-gateway:
    image: docker-mcp-gateway:latest
    security_opt:
      - no-new-privileges:true
      - seccomp:./seccomp-profile.json
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,nodev
    networks:
      - mcp-isolated
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

networks:
  mcp-isolated:
    driver: bridge
    internal: true # Sin acceso externo
```

### Aislamiento de Procesos con Permission Modes

```javascript
// Aplicación de Permission Mode
const { OperationGuard } = require('./.yard-core/core/permissions');

async function executeWithIsolation(operation, context) {
  const guard = new OperationGuard();

  // Verificar si la operación está permitida en el modo actual
  const permission = await guard.guard(operation.tool, {
    command: operation.command,
    args: operation.args,
  });

  if (!permission.proceed) {
    if (permission.needsConfirmation) {
      // Solicitar confirmación del usuario
      const confirmed = await requestUserConfirmation(operation);
      if (!confirmed) {
        throw new Error('Operación denegada por el usuario');
      }
    } else {
      throw new Error(`Operación bloqueada: ${permission.reason}`);
    }
  }

  // Ejecutar en contexto aislado
  return await isolatedExecutor.run(operation, {
    timeout: 30000,
    maxMemory: '256M',
    networkAccess: false,
  });
}
```

### Límites de Recursos

```javascript
// Configuración de límites de recursos
const resourceLimits = {
  cpu: {
    maxPercent: 50,
    throttleAt: 80,
  },
  memory: {
    maxMB: 512,
    warnAt: 400,
  },
  disk: {
    maxWriteMB: 100,
    tempDirMaxMB: 50,
  },
  network: {
    maxRequestsPerMinute: 100,
    maxBandwidthMBps: 10,
  },
  process: {
    maxConcurrent: 5,
    maxRuntime: 300000, // 5 minutos
  },
};
```

---

## Validación de Entrada

### Reglas de Validación por Tipo de Entrada

| Tipo de Entrada     | Reglas de Validación                    | Ejemplo                   |
| ------------------- | --------------------------------------- | ------------------------- |
| **Rutas de archivo**| Sin traversal, whitelist dirs, normalizar | `/project/src/file.ts`    |
| **Comandos**        | Whitelist comandos, sanitizar args      | `npm run build`           |
| **Nombres de proyecto** | Alfanumérico, guiones, guiones bajos| `my-project-01`           |
| **URLs**            | Whitelist de protocolos, validación de dominio | `https://api.example.com` |
| **Entrada de usuario** | Límites de longitud, filtrado de caracteres | `Comentario del usuario`  |
| **Configuración**   | Verificación de tipos, validación de enums | `{ mode: "ask" }`        |

### Implementación de Sanitizador de Entrada

```javascript
// .yard-core/core/security/input-sanitizer.js

class InputSanitizer {
  /**
   * Sanitizar ruta de archivo para prevenir directory traversal
   */
  static sanitizePath(inputPath, basePath) {
    // Remover null bytes
    let sanitized = inputPath.replace(/\0/g, '');

    // Normalizar separadores de ruta
    sanitized = sanitized.replace(/\\/g, '/');

    // Remover intentos de directory traversal
    sanitized = sanitized.replace(/\.\.+\//g, '');
    sanitized = sanitized.replace(/\/\.\.+/g, '');

    // Resolver a ruta absoluta
    const resolved = path.resolve(basePath, sanitized);

    // Verificar que la ruta está dentro del directorio permitido
    if (!resolved.startsWith(path.resolve(basePath))) {
      throw new SecurityError('Intento de directory traversal detectado');
    }

    return resolved;
  }

  /**
   * Sanitizar comando para ejecución segura
   */
  static sanitizeCommand(command) {
    // Bloquear patrones peligrosos
    const dangerousPatterns = [
      /;/g, // Encadenamiento de comandos
      /\|/g, // Pipes
      /&/g, // Background/AND
      /`/g, // Sustitución de comandos
      /\$\(/g, // Sustitución de comandos
      />/g, // Redirección
      /</g, // Redirección
      /\n/g, // Nuevas líneas
      /\r/g, // Retornos de carro
    ];

    let sanitized = command;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Limitar longitud
    if (sanitized.length > 1000) {
      throw new SecurityError('Comando demasiado largo');
    }

    return sanitized;
  }

  /**
   * Validar y sanitizar nombre de proyecto
   */
  static sanitizeProjectName(name) {
    // Solo permitir alfanumérico, guiones y guiones bajos
    const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '');

    if (sanitized.length === 0) {
      throw new SecurityError('Nombre de proyecto inválido');
    }

    if (sanitized.length > 64) {
      throw new SecurityError('Nombre de proyecto demasiado largo');
    }

    return sanitized;
  }

  /**
   * Validar URL
   */
  static validateUrl(url) {
    const allowedProtocols = ['https:', 'http:'];

    try {
      const parsed = new URL(url);

      if (!allowedProtocols.includes(parsed.protocol)) {
        throw new SecurityError('Protocolo de URL inválido');
      }

      // Bloquear localhost en producción
      if (process.env.NODE_ENV === 'production') {
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          throw new SecurityError('URLs de localhost no permitidas en producción');
        }
      }

      return parsed.toString();
    } catch (error) {
      throw new SecurityError(`URL inválida: ${error.message}`);
    }
  }
}
```

### Validación de Esquema

```javascript
// Usar JSON Schema para validación de configuración
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const configSchema = {
  type: 'object',
  required: ['version', 'permissions'],
  properties: {
    version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
    permissions: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['explore', 'ask', 'auto'] },
      },
      required: ['mode'],
    },
    security: {
      type: 'object',
      properties: {
        allowedDirectories: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
  additionalProperties: false,
};

function validateConfig(config) {
  const validate = ajv.compile(configSchema);
  const valid = validate(config);

  if (!valid) {
    throw new SecurityError(`Validación de configuración fallida: ${JSON.stringify(validate.errors)}`);
  }

  return config;
}
```

---

## Protección contra Inyección

### Prevención de Inyección de Comandos

```javascript
// PELIGROSO - Nunca hacer esto
const userInput = req.query.file;
exec(`cat ${userInput}`); // ¡Vulnerabilidad de inyección de comandos!

// SEGURO - Usar ejecución parametrizada
const { execFile } = require('child_process');
const userInput = sanitizePath(req.query.file, PROJECT_ROOT);
execFile('cat', [userInput], (error, stdout) => {
  // Ejecución segura
});

// MÁS SEGURO - Usar operaciones de archivo integradas
const fs = require('fs').promises;
const safePath = sanitizePath(req.query.file, PROJECT_ROOT);
const content = await fs.readFile(safePath, 'utf8');
```

### Prevención de Inyección SQL (Hook de SQL Governance)

```python
# .claude/hooks/sql-governance.py
# Este hook se aplica automáticamente

BLOCKED_PATTERNS = [
    r'CREATE\s+TABLE',
    r'DROP\s+TABLE',
    r'ALTER\s+TABLE',
    r'TRUNCATE',
    r'DELETE\s+FROM',
    r'UPDATE\s+.*\s+SET',
    r'INSERT\s+INTO',
]

def validate_sql(query: str) -> bool:
    """Bloquear operaciones SQL peligrosas sin aprobación explícita"""
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            raise SecurityError(f"Patrón SQL bloqueado detectado: {pattern}")
    return True
```

### Prevención de Inyección de Plantillas

```javascript
// PELIGROSO - Interpolación directa de plantillas
const template = `Hello ${userInput}!`; // ¡Vulnerabilidad XSS!

// SEGURO - Codificación HTML
const { escape } = require('html-escaper');
const template = `Hello ${escape(userInput)}!`;

// Para plantillas Markdown
function safeMarkdownInterpolation(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value === undefined) return match;

    // Escapar caracteres especiales de Markdown
    return String(value).replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&');
  });
}
```

### Prevención de Path Traversal

```javascript
// Aplicación de hook para archivos protegidos
// .claude/hooks/read-protection.py

PROTECTED_FILES = [
    '.claude/CLAUDE.md',
    '.claude/rules/*.md',
    '.yard-core/development/agents/*.md',
    'package.json',
    'tsconfig.json'
]

def validate_read(file_path: str, params: dict) -> bool:
    """Bloquear lecturas parciales en archivos protegidos"""
    for pattern in PROTECTED_FILES:
        if fnmatch.fnmatch(file_path, pattern):
            if params.get('limit') or params.get('offset'):
                raise SecurityError(
                    f"Lectura parcial bloqueada en archivo protegido: {file_path}\n"
                    "Debe leer el archivo completo."
                )
    return True
```

### Prevención de Prototype Pollution

```javascript
// Prevenir ataques de prototype pollution
function safeObjectMerge(target, source) {
  const blockedKeys = ['__proto__', 'constructor', 'prototype'];

  function merge(t, s, depth = 0) {
    if (depth > 10) {
      throw new SecurityError('Profundidad de merge de objeto excedida');
    }

    for (const key of Object.keys(s)) {
      if (blockedKeys.includes(key)) {
        throw new SecurityError(`Propiedad bloqueada: ${key}`);
      }

      if (typeof s[key] === 'object' && s[key] !== null) {
        t[key] = t[key] || {};
        merge(t[key], s[key], depth + 1);
      } else {
        t[key] = s[key];
      }
    }

    return t;
  }

  return merge(target, source);
}
```

---

## Logging y Auditoría

### Configuración de Audit Log

```yaml
# .yard/config.yaml - Configuración de auditoría
audit:
  enabled: true
  level: info # debug, info, warn, error

  # Qué registrar
  events:
    - authentication
    - authorization
    - fileAccess
    - commandExecution
    - configChange
    - agentActivation
    - modeChange
    - error

  # Configuración de salida
  output:
    file:
      enabled: true
      path.join(process.cwd(), '.yard', logs/audit.log
      maxSize: 10M
      maxFiles: 10
      compress: true
    console:
      enabled: false
    remote:
      enabled: false
      endpoint: https://logs.example.com/audit

  # Retención
  retention:
    days: 90
    archivePath: .yard/logs/archive
```

### Formato de Audit Log

```json
{
  "timestamp": "2026-01-29T14:30:00.000Z",
  "level": "info",
  "event": "commandExecution",
  "actor": {
    "type": "agent",
    "id": "dev",
    "name": "Dex"
  },
  "action": {
    "type": "execute",
    "tool": "Bash",
    "command": "npm run build"
  },
  "context": {
    "mode": "ask",
    "project": "my-project",
    "story": "1.1"
  },
  "result": {
    "status": "success",
    "duration": 12500
  },
  "security": {
    "approved": true,
    "approvedBy": "user",
    "riskLevel": "low"
  }
}
```

### Implementación de Audit Logger

```javascript
// .yard-core/core/security/audit-logger.js

const winston = require('winston');
const { format } = winston;

class AuditLogger {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
  }

  createLogger() {
    const transports = [];

    if (this.config.output.file.enabled) {
      transports.push(
        new winston.transports.File({
          filename: this.config.output.file.path,
          maxsize: this.parseSize(this.config.output.file.maxSize),
          maxFiles: this.config.output.file.maxFiles,
          tailable: true,
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      format: format.combine(format.timestamp(), format.json()),
      transports,
    });
  }

  log(event, data) {
    if (!this.config.events.includes(event)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      event,
      ...this.sanitizeData(data),
    };

    this.logger.info(entry);
  }

  sanitizeData(data) {
    // Remover información sensible antes de registrar
    const sensitivePatterns = [/api[_-]?key/i, /password/i, /secret/i, /token/i, /auth/i];

    const sanitized = JSON.parse(JSON.stringify(data));

    function redact(obj) {
      for (const key of Object.keys(obj)) {
        if (sensitivePatterns.some((p) => p.test(key))) {
          obj[key] = '[REDACTADO]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          redact(obj[key]);
        }
      }
    }

    redact(sanitized);
    return sanitized;
  }

  // Métodos de logging específicos
  logAuthentication(result, context) {
    this.log('authentication', {
      action: { type: 'authenticate', result: result.success ? 'success' : 'failure' },
      context,
      security: { failureReason: result.reason },
    });
  }

  logCommandExecution(command, result, context) {
    this.log('commandExecution', {
      action: { type: 'execute', command },
      result: { status: result.success ? 'success' : 'failure', duration: result.duration },
      context,
    });
  }

  logFileAccess(path, operation, context) {
    this.log('fileAccess', {
      action: { type: operation, path },
      context,
    });
  }

  logSecurityEvent(event, severity, details) {
    this.log('security', {
      action: { type: event },
      security: { severity, ...details },
    });
  }
}

module.exports = AuditLogger;
```

### Consultas de Análisis de Logs

```bash
# Encontrar todas las autenticaciones fallidas
jq 'select(.event == "authentication" and .result.status == "failure")' audit.log

# Encontrar todas las ejecuciones de comandos por agente
jq 'select(.event == "commandExecution" and .actor.type == "agent")' audit.log

# Encontrar todos los eventos de seguridad en las últimas 24 horas
jq 'select(.event == "security" and (.timestamp | fromdateiso8601) > (now - 86400))' audit.log

# Contar eventos por tipo
jq -s 'group_by(.event) | map({event: .[0].event, count: length})' audit.log
```

---

## Configuración de Producción vs Desarrollo

### Detección de Entorno

```javascript
// Carga de configuración consciente del entorno
function loadSecurityConfig() {
  const env = process.env.NODE_ENV || 'development';

  const baseConfig = require('./security-config.base.json');
  const envConfig = require(`./security-config.${env}.json`);

  return deepMerge(baseConfig, envConfig);
}
```

### Comparación de Configuración

| Configuración          | Desarrollo        | Producción       |
| ---------------------- | ----------------- | ---------------- |
| **YARD_DEBUG**         | `true`            | `false`          |
| **LOG_LEVEL**          | `debug`           | `info`           |
| **Permission Mode**    | `auto`            | `ask`            |
| **Rate Limiting**      | Relajado          | Estricto         |
| **CORS**               | `*`               | Orígenes específicos |
| **Detalles de Error**  | Stack traces completos | Mensajes genéricos |
| **Validación de API Key** | Solo advertencia | Bloquear si inválida |
| **SSL/TLS**            | Opcional          | Requerido        |
| **Audit Logging**      | Opcional          | Requerido        |
| **Timeout de Sesión**  | 24 horas          | 1 hora           |

### Configuración de Desarrollo

```yaml
# .yard/config.development.yaml
security:
  debug: true

  validation:
    strict: false
    warnOnly: true

  rateLimiting:
    enabled: false

  cors:
    origin: '*'
    credentials: true

  session:
    timeout: 86400000 # 24 horas
    secure: false

  audit:
    enabled: true
    level: debug
    console: true

  permissions:
    mode: auto
```

### Configuración de Producción

```yaml
# .yard/config.production.yaml
security:
  debug: false

  validation:
    strict: true
    warnOnly: false

  rateLimiting:
    enabled: true
    windowMs: 900000 # 15 minutos
    maxRequests: 1000

  cors:
    origin:
      - https://app.example.com
      - https://admin.example.com
    credentials: true

  session:
    timeout: 3600000 # 1 hora
    secure: true
    sameSite: strict

  tls:
    enabled: true
    minVersion: TLSv1.2
    ciphers: ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384

  headers:
    hsts: true
    hstsMaxAge: 31536000
    xssProtection: true
    noSniff: true
    frameOptions: DENY

  audit:
    enabled: true
    level: info
    console: false
    remote:
      enabled: true
      endpoint: https://logs.example.com/audit

  permissions:
    mode: ask
    requireApprovalFor:
      - delete
      - execute
```

### Script de Validación de Entorno

```javascript
// Validar requisitos de seguridad de producción
function validateProductionSecurity() {
  const errors = [];

  // Variables de entorno requeridas
  const required = ['JWT_SECRET', 'DATABASE_ENCRYPTION_KEY', 'SESSION_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Variable de entorno requerida faltante: ${key}`);
    }
  }

  // Debug debe estar desactivado
  if (process.env.YARD_DEBUG === 'true') {
    errors.push('YARD_DEBUG debe ser false en producción');
  }

  // TLS debe estar habilitado (verificar archivos de certificado)
  if (!fs.existsSync(process.env.TLS_CERT_PATH)) {
    errors.push('Certificado TLS no encontrado');
  }

  // Fortaleza de secretos
  if (process.env.JWT_SECRET?.length < 32) {
    errors.push('JWT_SECRET debe tener al menos 32 caracteres');
  }

  if (errors.length > 0) {
    throw new Error(`Validación de seguridad de producción fallida:\n${errors.join('\n')}`);
  }

  console.log('Validación de seguridad de producción aprobada');
}
```

---

## Lista de Verificación de Seguridad

### Lista de Verificación Pre-Despliegue

```markdown
## Lista de Verificación de Seguridad Pre-Despliegue

### Gestión de Secretos

- [ ] Todas las claves API almacenadas en variables de entorno o secret manager
- [ ] Sin secretos en código fuente o historial de git
- [ ] Archivo .env agregado a .gitignore
- [ ] Secretos de producción usan claves separadas de desarrollo
- [ ] Cronograma de rotación de secretos establecido

### Configuración

- [ ] NODE_ENV establecido a 'production'
- [ ] Modo debug deshabilitado
- [ ] Mensajes de error no exponen detalles internos
- [ ] Rate limiting configurado y probado
- [ ] CORS configurado correctamente para dominios de producción

### Autenticación y Autorización

- [ ] Política de contraseñas fuertes aplicada
- [ ] JWT secrets son criptográficamente fuertes (32+ caracteres)
- [ ] Expiración de tokens configurada apropiadamente
- [ ] Gestión de sesiones implementada
- [ ] Permission modes configurados (predeterminado: ask)

### Validación de Entrada

- [ ] Toda entrada de usuario sanitizada
- [ ] Validación de rutas de archivo habilitada
- [ ] Protección contra inyección de comandos activa
- [ ] Hooks de SQL governance instalados
- [ ] Validación de esquema para configuración

### Seguridad de Red

- [ ] TLS 1.2+ requerido
- [ ] Headers de seguridad configurados (HSTS, CSP, etc.)
- [ ] Puertos innecesarios cerrados
- [ ] Reglas de firewall implementadas

### Logging y Monitoreo

- [ ] Audit logging habilitado
- [ ] Archivos de log asegurados (permisos 640)
- [ ] Datos sensibles redactados de los logs
- [ ] Alertas configuradas para eventos de seguridad
- [ ] Política de retención de logs establecida

### Seguridad de Dependencias

- [ ] npm audit no muestra vulnerabilidades críticas
- [ ] Dependabot o similar habilitado
- [ ] Lockfile commiteado y verificado
```

### Lista de Verificación de Seguridad Continua

```markdown
## Mantenimiento de Seguridad Continuo

### Semanal

- [ ] Revisar alertas de seguridad del monitoreo
- [ ] Verificar nuevas vulnerabilidades de dependencias
- [ ] Revisar logs de acceso en busca de anomalías

### Mensual

- [ ] Ejecutar escaneo de seguridad completo (npm audit, snyk)
- [ ] Actualizar dependencias con parches de seguridad
- [ ] Revisar y rotar tokens de servicio
- [ ] Auditar acceso y permisos de usuarios

### Trimestral

- [ ] Pruebas de penetración completas
- [ ] Revisar y actualizar políticas de seguridad
- [ ] Rotar secretos de larga duración (claves API, JWT secrets)
- [ ] Actualización de capacitación en seguridad

### Anual

- [ ] Auditoría de seguridad por terceros
- [ ] Pruebas de recuperación ante desastres
- [ ] Rotación completa de secretos
- [ ] Revisión de arquitectura de seguridad
```

---

## Reporte de Vulnerabilidades

### Política de Divulgación Responsable

Si descubres una vulnerabilidad de seguridad en Synkra YARD, por favor sigue las prácticas de divulgación responsable:

### Proceso de Reporte

1. **NO** crees un issue público en GitHub para vulnerabilidades de seguridad
2. Reporta preocupaciones de seguridad via [GitHub Security Advisories](https://github.com/ernesto-langa/yard-core/security/advisories)
3. Incluye lo siguiente en tu reporte:
   - Descripción de la vulnerabilidad
   - Pasos para reproducir
   - Evaluación del impacto potencial
   - Cualquier corrección sugerida (opcional)

### Qué Incluir

```markdown
## Plantilla de Reporte de Vulnerabilidad

**Tipo de Vulnerabilidad:** [ej., Command Injection, XSS, Auth Bypass]

**Severidad:** [Crítica / Alta / Media / Baja]

**Componente Afectado:** [ej., InputSanitizer, AuthSystem, MCP Gateway]

**Versión de YARD:** [ej., 2.1.0]

**Descripción:**
[Descripción detallada de la vulnerabilidad]

**Pasos para Reproducir:**

1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Prueba de Concepto:**
[Código o comandos para demostrar la vulnerabilidad]

**Impacto:**
[Qué podría lograr un atacante con esta vulnerabilidad]

**Corrección Sugerida:**
[Opcional: Tu recomendación para corregir el problema]
```

### Cronograma de Respuesta

| Etapa                    | Plazo                  |
| ------------------------ | ---------------------- |
| Acuse de recibo inicial  | 24 horas               |
| Evaluación preliminar    | 72 horas               |
| Desarrollo de corrección | 7-14 días              |
| Lanzamiento del parche   | 14-30 días             |
| Divulgación pública      | 90 días (o después del fix) |

### Salón de la Fama de Seguridad

Los contribuyentes que divulguen vulnerabilidades de manera responsable son reconocidos en nuestro Salón de la Fama de Seguridad (con permiso).

### Programa de Bug Bounty

Actualmente, Synkra YARD no tiene un programa formal de bug bounty. Sin embargo, las contribuciones significativas de seguridad son reconocidas y pueden recibir licencias de YARD Pro u otro reconocimiento.

---

## Documentación Relacionada

- [Mejores Prácticas de Seguridad](../security-best-practices.md) - Directrices generales de seguridad
- [Guía de Permission Modes](./permission-modes.md) - Control de autonomía de agentes
- [Configuración Global de MCP](./mcp-global-setup.md) - Configuración segura de MCP
- [Quality Gates](./quality-gates.md) - Verificaciones de seguridad en CI/CD

---

_Guía de Hardening de Seguridad de Synkra YARD v4.0_
