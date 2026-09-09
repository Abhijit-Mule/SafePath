import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

const DEFAULT_CENTER = [18.5204, 73.8567];

export default function ReportMap({ reports }) {
  const points = reports.filter(r => Number.isFinite(Number(r.location?.lat)) && Number.isFinite(Number(r.location?.lng)));
  const center = points.length ? [Number(points[0].location.lat), Number(points[0].location.lng)] : DEFAULT_CENTER;

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="report-map">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map(report => (
          <CircleMarker key={report._id} center={[Number(report.location.lat), Number(report.location.lng)]} radius={8} pathOptions={{ className: `status-${report.status}` }}>
            <Popup>
              <strong>{report.location.address || 'Reported road issue'}</strong>
              <br />Status: {report.status}
              {report.description && <><br />{report.description}</>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
