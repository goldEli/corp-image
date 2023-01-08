import type {
  Dispatch,
  ForwardedRef,
  MutableRefObject,
  SetStateAction,
} from "react";
import type { default as Cropper } from "react-easy-crop";
import type { CropperProps } from "react-easy-crop";
import type { Area, Point } from "react-easy-crop/types";
import type { RcFile } from "antd/es/upload/interface";

export type ImgCropProps = {
  file: string;
  open: boolean;
  aspect?: number;
  shape?: "rect" | "round";
  grid?: boolean;
  quality?: number;
  fillColor?: string;

  zoom?: boolean;
  rotate?: boolean;
  minZoom?: number;
  maxZoom?: number;

  modalTitle?: string;
  modalWidth?: number | string;
  modalOk?: string;
  modalCancel?: string;
  modalMaskTransitionName?: string;
  modalClassName?: string;
  modalTransitionName?: string;
  onModalOk?: (file: void | boolean | string | Blob | File) => void;
  onModalCancel?: () => void;

  beforeCrop?: (file: RcFile, fileList: RcFile[]) => boolean | Promise<boolean>;
  onUploadFail?: (err: Error) => void;
  cropperProps?: Partial<CropperProps>;

  // children: JSX.Element;
};

export type EasyCropRef = {
  rotateVal: number;
  setZoomVal: Dispatch<SetStateAction<number>>;
  setRotateVal: Dispatch<SetStateAction<number>>;
  cropPixelsRef: MutableRefObject<Area>;
};

export type EasyCropProps = Required<
  Pick<
    ImgCropProps,
    | "aspect"
    | "shape"
    | "grid"
    | "zoom"
    | "rotate"
    | "minZoom"
    | "maxZoom"
    | "cropperProps"
  >
> & {
  cropperRef: ForwardedRef<Cropper>;
  image: string;
  onChange(point: Point): void;
};

export type OnModalOk = NonNullable<ImgCropProps["onModalOk"]>;
