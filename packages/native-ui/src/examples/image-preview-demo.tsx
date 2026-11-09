import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ImagePreview, ImagePreviewImage } from '@/components/data-display/image-preview';

/**
 * An 80px indigo circle on a transparent ground, as a PNG: React Native's Image draws no svg, which the web
 * demo's sample is.
 */
const SAMPLE_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAB40lEQVR42u3cv22DQBSAcW/ABozgESjTpvMILinZgJIxXDKCV6Bkg1C6vBLnFXdSRBHJ9oP7877ia6IkRj/ZBo67O31//Zzo/UAAEEAAASQAAQTw7WrpIvXSKE3SIjlp9Tn/s8n/Tu//prYK2EiDNEvPD5v9/2pKB6ykTgntP8zOv1YxgJX/yLkd4bY5/5pV7oCt9DgQbtvDH0N2gGfpHhFu290fUxaAV3/mfCbW6o8tacAhQbhtQ6qAtwzwQrfUAMeM8EJjKoC3DPHU3okWvvN2/U789Gz7LKTr0YDnRC9VPrnEOR8JeC8I7+/F9iGAbYF4oXZvwCryve0R987VnoB9wXihfi/A6uAhqVi5V96FrwB2BvBC3R6AsyHAWRuwMYQXajQBB4OAgybgbBBw1gKsDeKFag3Ai2HAiwZgbxiw1wAcDQOOGoCTYcBJA3AxDLhoADrDgE4DcDUMuAKYACAfYU4icU8iXMZwIR33QppbOQYT4g4mMJzFgGrcAVWG9HmoFP+hEo81ebAe/8E6UzuYXBR3chHT25hgGX+CJVN8mWSexiRzljmw0Cb+QhuWerHYkOWuxSx3ZcE1S/7ZdKKYTSfY9kQ5Nt5RhGTrJ6XYfEwxtr+zHAgAAggggAQggJn2C/bccQRY8GecAAAAAElFTkSuQmCC';

/** A small sample graphic over the transparency checkerboard, contained within its sized wrapper. */
function ImagePreviewDemo(): ReactNode {
  return (
    <View className="size-32">
      <ImagePreview>
        <ImagePreviewImage src={SAMPLE_IMAGE} alt="Sample circular graphic" />
      </ImagePreview>
    </View>
  );
}

export { ImagePreviewDemo };
