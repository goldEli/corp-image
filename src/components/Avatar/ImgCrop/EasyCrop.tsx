import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Cropper from "react-easy-crop";
import type { Area, MediaSize, Point, Size } from "react-easy-crop/types";
import AntSlider from "antd/es/slider";
import {
  INIT_ROTATE,
  INIT_ZOOM,
  MAX_ROTATE,
  MIN_ROTATE,
  PREFIX,
  ROTATE_STEP,
  ZOOM_STEP,
} from "./constants";
import type { EasyCropProps, EasyCropRef } from "./types";
import styled from "@emotion/styled";

interface StyledProps {
  height: number;
  x: number;
  y: number;
  zoom: number;
}

const ImgBox = styled.div`
  width: ${(props: StyledProps) => `${props.height}px`};
  height: ${(props: StyledProps) => `${props.height}px`};
  transform: ${(props: StyledProps) => {
    return `scale(${100 / props.height})`;
  }};
  transform-origin: 0 0 0;
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    height: ${(props: StyledProps) => `${props.height}px`};
    transform: ${(props: StyledProps) => {
      return `translate(${props.x}px, ${props.y}px) scale(${props.zoom})`;
    }};
  }
`;
const Box = styled.div`
  width: 500px;
  display: flex;
`;
const Left = styled.div`
  width: 300px;
`;

const Right = styled.div`
  flex: 1;
`;

function getStyleValue(dom: Element | null) {
  if (!dom) {
    return 0;
  }
  return parseFloat(getComputedStyle(dom)["height"]);
}

const EasyCrop = forwardRef<EasyCropRef, EasyCropProps>((props, ref) => {
  const {
    cropperRef,
    image,

    aspect,
    shape,
    grid,
    zoom,
    rotate,
    minZoom,
    maxZoom,
    cropperProps,
  } = props;

  const [crop, onCropChange] = useState<Point>({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState<Size>({ width: 0, height: 0 });
  const [zoomVal, setZoomVal] = useState(INIT_ZOOM);
  const [rotateVal, setRotateVal] = useState(INIT_ROTATE);
  const cropPixelsRef = useRef<Area>({ width: 0, height: 0, x: 0, y: 0 });

  const onMediaLoaded = useCallback(
    (mediaSize: MediaSize) => {
      const { width, height } = mediaSize;
      const ratioWidth = height * aspect;

      if (width > ratioWidth) {
        setCropSize({ width: ratioWidth, height });
      } else {
        setCropSize({ width, height: width / aspect });
      }
    },
    [aspect]
  );

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    cropPixelsRef.current = croppedAreaPixels;
  }, []);

  useImperativeHandle(ref, () => ({
    rotateVal,
    setZoomVal,
    setRotateVal,
    cropPixelsRef,
  }));
  console.log({ crop, image, zoomVal });
  const height = getStyleValue(document.querySelector(".img-crop-media"));
  return (
    <Box>
      <Left>
        <Cropper
          {...cropperProps}
          ref={cropperRef}
          image={image}
          crop={crop}
          cropSize={cropSize}
          onCropChange={(location) => {
            onCropChange(location);
            props.onChange(location);
          }}
          aspect={aspect}
          cropShape={shape}
          showGrid={grid}
          zoomWithScroll={zoom}
          zoom={zoomVal}
          rotation={rotateVal}
          onZoomChange={setZoomVal}
          onRotationChange={setRotateVal}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onMediaLoaded={onMediaLoaded}
          onCropComplete={onCropComplete}
          classes={{
            containerClassName: `${PREFIX}-container`,
            mediaClassName: `${PREFIX}-media`,
          }}
        />
        {zoom && (
          <section className={`${PREFIX}-control ${PREFIX}-control-zoom`}>
            <button
              onClick={() => setZoomVal(zoomVal - ZOOM_STEP)}
              disabled={zoomVal - ZOOM_STEP < minZoom}
            >
              －
            </button>
            <button
              onClick={() => setZoomVal(zoomVal + ZOOM_STEP)}
              disabled={zoomVal + ZOOM_STEP > maxZoom}
            >
              ＋
            </button>
          </section>
        )}
        {/* {rotate && (
        <section className={`${PREFIX}-control ${PREFIX}-control-rotate`}>
          <button
            onClick={() => setRotateVal(rotateVal - ROTATE_STEP)}
            disabled={rotateVal === MIN_ROTATE}
          >
            ↺
          </button>
          <AntSlider
            min={MIN_ROTATE}
            max={MAX_ROTATE}
            step={ROTATE_STEP}
            value={rotateVal}
            onChange={setRotateVal}
          />
          <button
            onClick={() => setRotateVal(rotateVal + ROTATE_STEP)}
            disabled={rotateVal === MAX_ROTATE}
          >
            ↻
          </button>
        </section>
      )} */}
      </Left>
      <Right>
        <ImgBox height={height} zoom={zoomVal} x={crop.x} y={crop.y}>
          <img
            style={{
              height: height + "px",
            }}
            src={image}
          />
        </ImgBox>
      </Right>
    </Box>
  );
});

export default memo(EasyCrop);
