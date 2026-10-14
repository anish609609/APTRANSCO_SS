/**
 * SAT-TWIN: IEC 61850 Utility Integration Adapter & Point Mapper
 * Prepares actual substation automation protocol mapping for APTRANSCO Sattenapalli 4012.
 * Covers:
 * - Station Bus: IEC 61850-8-1 MMS (Client/Server telemetry reporting)
 * - Process Bus: IEC 61850-9-2 Sampled Values (Merging Units SV)
 * - Inter-bay / Protection: IEC 61850-8-1 GOOSE (Fast trip, interlocking)
 * - Point Mapping Table (MMXU, XCBR, XSWI, YPTR, CSWI, PTRC)
 */

export interface IEC61850PointMap {
  logicalDevice: string;
  logicalNode: string; // e.g. "MMXU1", "XCBR1", "YPTR1"
  dataObject: string;  // e.g. "TotW", "Pos", "WdHotSpot"
  dataAttribute: string; // e.g. "mag.f", "stVal", "q", "t"
  iecDescription: string;
  digitalImageAssetId: string;
  metricKey: string;
  unit: string;
  protocolProfile: 'MMS_REPORT' | 'GOOSE_MULTICAST' | 'SAMPLED_VALUES_9_2';
  qualityMapping: string;
}

export const IEC61850_POINT_MAPPINGS: IEC61850PointMap[] = [
  // Transformer ICT-01 (YPTR & MMXU)
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'MMXU1',
    dataObject: 'TotW',
    dataAttribute: 'mag.f',
    iecDescription: 'Three-phase total active power (MW)',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'activePowerMW',
    unit: 'MW',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'IEC 61850 q-bit validity (00=Good, 01=Invalid, 11=Questionable)',
  },
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'MMXU1',
    dataObject: 'TotVAr',
    dataAttribute: 'mag.f',
    iecDescription: 'Three-phase total reactive power (MVAR)',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'reactivePowerMVAR',
    unit: 'MVAR',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'IEC 61850 q-bit validity',
  },
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'MMXU1',
    dataObject: 'PhV.phsA',
    dataAttribute: 'cVal.mag.f',
    iecDescription: 'Phase A voltage magnitude (400 kV bus step-down)',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'hvVoltageKV',
    unit: 'kV',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'IEC 61850 q-bit validity',
  },
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'YPTR1',
    dataObject: 'WdHotSpot',
    dataAttribute: 'mag.f',
    iecDescription: 'Calculated / Fibre optic winding hot-spot temperature',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'windingHotSpotTempC',
    unit: '°C',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.detailQual.overflow / failure',
  },
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'YPTR1',
    dataObject: 'TopOilTmp',
    dataAttribute: 'mag.f',
    iecDescription: 'OTI top oil temperature reading from RTD transmitter',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'topOilTempC',
    unit: '°C',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.detailQual.badReference',
  },
  {
    logicalDevice: 'SAT4012_ICT01_IED',
    logicalNode: 'YLTC1',
    dataObject: 'TapPos',
    dataAttribute: 'valW.f',
    iecDescription: 'OLTC tap position indicator',
    digitalImageAssetId: 'ICT-01',
    metricKey: 'tapPosition',
    unit: 'step (1-17)',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.validity',
  },
  // Circuit Breakers (XCBR)
  {
    logicalDevice: 'SAT4012_BAY401_BCU',
    logicalNode: 'XCBR1',
    dataObject: 'Pos',
    dataAttribute: 'stVal',
    iecDescription: 'Circuit breaker operating switch position (00=Inter, 01=Closed, 10=Open, 11=Bad)',
    digitalImageAssetId: 'CB-401',
    metricKey: 'state',
    unit: 'State',
    protocolProfile: 'GOOSE_MULTICAST',
    qualityMapping: 'IEC 61850 Double-point status with q.test flag',
  },
  {
    logicalDevice: 'SAT4012_BAY401_BCU',
    logicalNode: 'SIML1',
    dataObject: 'Pres',
    dataAttribute: 'mag.f',
    iecDescription: 'SF6 gas insulation density / pressure sensor',
    digitalImageAssetId: 'CB-401',
    metricKey: 'sf6PressureBar',
    unit: 'bar',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.validity',
  },
  {
    logicalDevice: 'SAT4012_BAY401_BCU',
    logicalNode: 'XCBR1',
    dataObject: 'OpCnt',
    dataAttribute: 'stVal',
    iecDescription: 'Mechanical breaker operation counter',
    digitalImageAssetId: 'CB-401',
    metricKey: 'operatingCounter',
    unit: 'operations',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.validity',
  },
  // Bus Reactor (YPTR / MMXU)
  {
    logicalDevice: 'SAT4012_RE401_IED',
    logicalNode: 'MMXU1',
    dataObject: 'TotVAr',
    dataAttribute: 'mag.f',
    iecDescription: '125 MVAR Shunt reactor reactive power consumption',
    digitalImageAssetId: 'RE-401',
    metricKey: 'reactivePowerMVAR',
    unit: 'MVAR',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.validity',
  },
  // Bus Frequency (MMXU)
  {
    logicalDevice: 'SAT4012_BUS400_BCU',
    logicalNode: 'MMXU1',
    dataObject: 'Hz',
    dataAttribute: 'mag.f',
    iecDescription: '400 kV Main Busbar system frequency',
    digitalImageAssetId: 'BUS-400-1',
    metricKey: 'frequencyHz',
    unit: 'Hz',
    protocolProfile: 'MMS_REPORT',
    qualityMapping: 'q.validity',
  },
];

export interface ProtocolConnectorSpec {
  protocolName: string;
  sourceDevice: string;
  profileStandard: string;
  networkSegment: string;
  securityControls: string[];
  failureBehavior: string;
  acceptanceTestCriteria: string;
}

export const CONNECTOR_SPECS: ProtocolConnectorSpec[] = [
  {
    protocolName: 'IEC 61850-8-1 MMS (Manufacturing Message Spec)',
    sourceDevice: 'Substation SAS Gateway / RTU (e.g., GE D200 / ABB COM600 / Siemens SICAM PAS)',
    profileStandard: 'TCP/IP Port 102 (ISO COTP over RFC 1006) with MMS Buffered/Unbuffered Reporting',
    networkSegment: 'Station Bus (VLAN 10: 192.168.12.0/24, isolated from corporate LAN via Data Diode / Firewall)',
    securityControls: [
      'IEC 62351-4 TLS 1.3 Transport Security with digital certificates',
      'Role-based access control (read-only monitoring credential for digital image)',
      'Substation DMZ termination with unidirectional data diode to digital image ingestion service',
    ],
    failureBehavior: 'Automatic TCP reconnect with 5s exponential backoff, buffer replay with sequence number deduplication, flags stale telemetry if silence > 10s.',
    acceptanceTestCriteria: 'Verify report dataset reception without packet drops over 72 hours; verify timestamp skew < 10ms with substation GPS Master Clock (PTP IEEE 1588).',
  },
  {
    protocolName: 'IEC 61850-8-1 GOOSE (Generic Object Oriented Substation Events)',
    sourceDevice: 'Bay Control Units (BCUs) & Numerical Protection Relays (e.g., ABB REF615 / SEL-487E / Siemens 7SJ85)',
    profileStandard: 'Ethernet Layer 2 Multicast (Ethertype 0x88B8), priority-tagged (802.1Q PCP 4-7)',
    networkSegment: 'Process Bus / Inter-bay Bus (VLAN 20: Strict physical segregation or MAC filtering)',
    securityControls: [
      'IEC 62351-6 GOOSE digital signature authentication',
      'Read-only SPAN port mirror to Digital Image network adapter (TX disabled physically on SFP fiber transceiver)',
    ],
    failureBehavior: 'Stale flag asserted if timeAllowedToLive expires before next retransmission; alert on SqNum/StNum jump.',
    acceptanceTestCriteria: 'End-to-end trip indication captured in Digital Image within < 12 ms of simulated relay trip.',
  },
  {
    protocolName: 'IEC 61850-9-2 LE (Sampled Values for Merging Units)',
    sourceDevice: 'Optical / Rogowski Coil Electronic Instrument Transformers & Merging Units (MUs)',
    profileStandard: 'Ethernet Layer 2 (Ethertype 0x88BA) 4000/4800 samples/sec (80 samples/cycle at 50 Hz)',
    networkSegment: 'Process Bus (VLAN 30: Dedicated 1 Gbps fiber ring, IEEE 1588 PTP synchronized)',
    securityControls: [
      'Isolated process network; no IP routing; passive optical tap to Digital Image DSP edge node',
    ],
    failureBehavior: 'Clock sync unlock flag triggers telemetry quality invalid; fallback to SCADA RMS values.',
    acceptanceTestCriteria: 'Phase angle accuracy within 0.1 degree compared to calibrated reference calibrator.',
  },
];

export function generateSattenapalliSCL(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
  <Header id="SAT4012_SCL" version="1.0" revision="0" toolID="SAT-TWIN-SCL-GEN">
    <History>
      <Hitem version="1.0" revision="0" when="2026-10-10T00:00:00Z" who="APTRANSCO Digital Image Project" what="Provisional SCL for Sattenapalli 400/220kV Substation (ID 4012)"/>
    </History>
  </Header>
  <Substation name="Sattenapalli_4012" desc="APTRANSCO 400/220 kV Transmission Substation">
    <VoltageLevel name="EHV_400kV" desc="400 kV Main Switchyard" nomFreq="50" numPhases="3">
      <Voltage unit="V" multiplier="k">400</Voltage>
      <Bay name="BAY_401" desc="400 kV ICT-1 Transformer Bay">
        <ConductingEquipment name="CB_401" type="CBR" desc="420 kV 3150A 50kA SF6 Circuit Breaker">
          <LNode iedName="SAT4012_BAY401_BCU" ldInst="PROT" lnClass="XCBR" lnInst="1"/>
          <LNode iedName="SAT4012_BAY401_BCU" ldInst="CTRL" lnClass="CSWI" lnInst="1"/>
        </ConductingEquipment>
        <ConductingEquipment name="DS_401A" type="DIS" desc="Bus-1 Isolator">
          <LNode iedName="SAT4012_BAY401_BCU" ldInst="CTRL" lnClass="XSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
      <Bay name="BAY_406" desc="125 MVAR Shunt Bus Reactor Bay">
        <ConductingEquipment name="RE_401" type="REA" desc="125 MVAR Shunt Reactor"/>
      </Bay>
    </VoltageLevel>
    <VoltageLevel name="HV_220kV" desc="220 kV Switchyard" nomFreq="50" numPhases="3">
      <Voltage unit="V" multiplier="k">220</Voltage>
      <Bay name="BAY_201" desc="220 kV ICT-1 Secondary Bay">
        <ConductingEquipment name="CB_201" type="CBR" desc="245 kV 2000A SF6 Circuit Breaker"/>
      </Bay>
    </VoltageLevel>
  </Substation>
  <Communication>
    <SubNetwork name="STATION_BUS" type="8-MMS">
      <ConnectedAP iedName="SAT4012_ICT01_IED" apName="S1">
        <Address>
          <P type="IP">192.168.12.11</P>
          <P type="IP-SUBNET">255.255.255.0</P>
          <P type="IP-GATEWAY">192.168.12.1</P>
          <P type="OSI-TSEL">0001</P>
        </Address>
      </ConnectedAP>
    </SubNetwork>
  </Communication>
</SCL>`;
}
