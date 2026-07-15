import { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Typography } from 'antd';
import {
  FileTextOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  FileOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PALETA } from '@/theme/theme';

const { Text } = Typography;

interface Comando {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  ruta: string;
}

const COMANDOS: Comando[] = [
  { id: 'radicador', label: 'Radicar solicitud', icon: <FileOutlined />, ruta: '/panel/radicador' },
  { id: 'querella', label: 'Nueva querella', icon: <FileTextOutlined />, ruta: '/panel/nuevo-caso?tipo=querella' },
  { id: 'queja', label: 'Nueva queja', icon: <MessageOutlined />, ruta: '/panel/nuevo-caso?tipo=queja' },
  { id: 'actas', label: 'Actas de firmeza', icon: <SafetyCertificateOutlined />, ruta: '/panel/actas-firmeza' },
  { id: 'normas', label: 'Buscar norma', shortcut: '', icon: <BookOutlined />, ruta: '/panel/normas' },
  { id: 'archivo', label: 'Archivo digital', icon: <FolderOpenOutlined />, ruta: '/panel/archivo' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAbierto((a) => !a);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtrados = useMemo(() => {
    if (!busqueda) return COMANDOS;
    const q = busqueda.toLowerCase();
    return COMANDOS.filter((c) => c.label.toLowerCase().includes(q));
  }, [busqueda]);

  function seleccionar(c: Comando) {
    setAbierto(false);
    setBusqueda('');
    navigate(c.ruta);
  }

  return (
    <Modal
      open={abierto}
      onCancel={() => { setAbierto(false); setBusqueda(''); }}
      footer={null}
      closable={false}
      centered
      width={520}
      styles={{
        mask: { background: 'rgba(0,0,0,0.18)' },
        content: { padding: 0, overflow: 'hidden', borderRadius: 20 },
      }}
    >
      <div style={{ padding: '0' }}>
        <Input
          size="large"
          prefix={<SearchOutlined style={{ color: PALETA.textoTenue }} />}
          placeholder="Escriba un comando…"
          variant="borderless"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtrados.length > 0) {
              seleccionar(filtrados[0]);
            }
            if (e.key === 'Escape') {
              setAbierto(false);
              setBusqueda('');
            }
          }}
          autoFocus
          style={{ fontSize: 16, padding: '16px 20px', borderBottom: `1px solid ${PALETA.borde}` }}
        />
        <div style={{ maxHeight: 320, overflow: 'auto', padding: '6px 0' }}>
          {filtrados.map((c) => (
            <div
              key={c.id}
              onClick={() => seleccionar(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 20px',
                cursor: 'pointer',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f7f9fc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <span style={{ color: PALETA.textoSuave, fontSize: 15, width: 20, textAlign: 'center' }}>{c.icon}</span>
              <Text style={{ flex: 1, fontSize: 14 }}>{c.label}</Text>
              {c.shortcut && (
                <Text type="secondary" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{c.shortcut}</Text>
              )}
            </div>
          ))}
          {filtrados.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: PALETA.textoTenue, fontSize: 13 }}>
              Sin resultados
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
