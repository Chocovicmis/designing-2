import { TextElement } from '../lib/supabase';

interface CardPreviewProps {
  backgroundImageUrl: string;
  textElements: TextElement[];
  dimension: 'square' | 'landscape' | 'portrait';
  width?: number;
  height?: number;
}

export default function CardPreview({
  backgroundImageUrl,
  textElements,
  dimension,
  width: customWidth,
  height: customHeight
}: CardPreviewProps) {
  const dimensionSpecs = {
    square: { width: 800, height: 800 },
    landscape: { width: 1000, height: 600 },
    portrait: { width: 600, height: 1000 }
  };

  const { width: baseWidth, height: baseHeight } = dimensionSpecs[dimension];
  const width = customWidth || baseWidth;
  const height = customHeight || baseHeight;
  const scale = customWidth ? customWidth / baseWidth : 1;

  return (
    <div
      className="card-preview-render"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }}
    >
      {textElements.map(el => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.x * scale}px`,
            top: `${el.y * scale}px`,
            width: `${el.width * scale}px`,
            fontSize: `${el.fontSize * scale}px`,
            fontWeight: el.fontWeight,
            color: el.color,
            textAlign: el.textAlign,
            fontFamily: el.fontFamily,
            whiteSpace: 'pre-wrap',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {el.content}
        </div>
      ))}
    </div>
  );
}
