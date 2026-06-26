import { Result } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

export function EnConstruccion({ modulo }: { modulo: string }) {
  return (
    <Result
      icon={<ToolOutlined />}
      title={`Módulo de ${modulo}`}
      subTitle="Esta sección está en construcción. Próximamente disponible."
    />
  );
}
