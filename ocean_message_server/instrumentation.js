const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');

// Configure the OTLP trace exporter
const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: process.env.OTEL_EXPORTER_OTLP_HEADERS 
    ? Object.fromEntries(
        process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(h => {
          const index = h.indexOf('=');
          return [h.substring(0, index).trim(), h.substring(index + 1).trim()];
        })
      )
    : {}
});

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable filesystem instrumentation to avoid high volume of spans
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Disable net instrumentation to avoid duplicate outgoing tracing spans if http is enabled
      '@opentelemetry/instrumentation-net': { enabled: false }
    })
  ],
  serviceName: process.env.OTEL_SERVICE_NAME || 'ocean-message-server'
});

sdk.start();

console.log(`📡 OpenTelemetry initialized for: ${process.env.OTEL_SERVICE_NAME || 'ocean-message-server'}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated successfully'))
    .catch((err) => console.error('Error terminating tracing:', err))
    .finally(() => process.exit(0));
});
