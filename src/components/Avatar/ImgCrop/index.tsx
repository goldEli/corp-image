import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type CropperRef from "react-easy-crop";
import type { UploadProps } from "antd";
import { version } from "antd";
import LocaleReceiver from "antd/es/locale-provider/LocaleReceiver";
import AntModal from "antd/es/modal";
import AntUpload from "antd/es/upload";
import type { RcFile, UploadFile } from "antd/es/upload";
// import { compareVersions } from 'compare-versions';
import { INIT_ROTATE, INIT_ZOOM, PREFIX } from "./constants";
import type {
  EasyCropProps,
  EasyCropRef,
  ImgCropProps,
  OnModalOk,
} from "./types";
import EasyCrop from "./EasyCrop";
import "./index.less";

export type { ImgCropProps } from "./types";

// const modalVisibleProp =
//   compareVersions(version, '4.23.0') === -1
//     ? { visible: true }
//     : { open: true };

const ImgCrop = forwardRef<CropperRef, ImgCropProps>((props, cropperRef) => {
  const {
    aspect = 1,
    shape = "rect",
    grid = false,
    quality = 0.4,
    fillColor = "white",

    zoom = true,
    rotate = false,
    minZoom = 1,
    maxZoom = 3,

    modalTitle,
    modalWidth,
    modalOk,
    modalCancel,
    modalMaskTransitionName,
    modalTransitionName,
    modalClassName,
    onModalOk,
    onModalCancel,

    beforeCrop,
    onUploadFail,
    cropperProps,
    children,
  } = props;

  const cb = useRef<
    Pick<
      ImgCropProps,
      "onModalOk" | "onModalCancel" | "beforeCrop" | "onUploadFail"
    >
  >({});
  cb.current.onModalOk = onModalOk;
  cb.current.onModalCancel = onModalCancel;
  cb.current.beforeCrop = beforeCrop;
  cb.current.onUploadFail = onUploadFail;

  /**
   * Upload
   */
  const [image, setImage] = useState("");
  const fileRef = useRef<UploadFile>({} as UploadFile);
  const beforeUploadRef = useRef<UploadProps["beforeUpload"]>();
  const resolveRef = useRef<OnModalOk>(() => {});
  const rejectRef = useRef<(err: Error) => void>(() => {});

  const uploadComponent = useMemo(() => {
    const upload = Array.isArray(children) ? children[0] : children;
    const { beforeUpload, accept, ...restUploadProps } = upload.props;
    beforeUploadRef.current = beforeUpload;

    return {
      ...upload,
      props: {
        ...restUploadProps,
        accept: accept || "image/*",
        beforeUpload: (file: RcFile, fileList: RcFile[]) => {
          return new Promise(async (resolve, reject) => {
            if (cb.current.beforeCrop) {
              const shouldCrop = await cb.current.beforeCrop(file, fileList);
              if (!shouldCrop) {
                return reject();
              }
            }

            fileRef.current = file as UploadFile;
            resolveRef.current = (newFile) => {
              cb.current.onModalOk?.(newFile);
              resolve(newFile);
            };
            rejectRef.current = (uploadErr) => {
              cb.current.onUploadFail?.(uploadErr);
              reject();
            };

            const reader = new FileReader();
            reader.addEventListener("load", () => {
              if (typeof reader.result === "string") {
                setImage(reader.result);
              }
            });
            reader.readAsDataURL(file as unknown as Blob);
          });
        },
      },
    };
  }, [children]);

  /**
   * Crop
   */
  const easyCropRef = useRef<EasyCropRef>({} as EasyCropRef);

  /**
   * Modal
   */
  const modalProps = useMemo(() => {
    const obj = {
      width: modalWidth,
      okText: modalOk,
      cancelText: modalCancel,
      maskTransitionName: modalMaskTransitionName,
      transitionName: modalTransitionName,
    };
    Object.keys(obj).forEach((prop) => {
      const key = prop as keyof typeof obj;
      if (obj[key] === undefined) {
        delete obj[key];
      }
    });
    return obj;
  }, [
    modalCancel,
    modalMaskTransitionName,
    modalOk,
    modalTransitionName,
    modalWidth,
  ]);

  const onClose = () => {
    setImage("");
    easyCropRef.current.setZoomVal(INIT_ZOOM);
    easyCropRef.current.setRotateVal(INIT_ROTATE);
  };

  const onCancel = useCallback(() => {
    cb.current.onModalCancel?.();
    onClose();
  }, []);

  const onOk = useCallback(
    async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      onClose();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
      const target = event.target;
      const context =
        ((target as ShadowRoot)?.getRootNode?.() as ShadowRoot) || document;

      const imgSource = context.querySelector(
        `.${PREFIX}-media`
      ) as CanvasImageSource & {
        naturalWidth: number;
        naturalHeight: number;
      };

      const {
        width: cropWidth,
        height: cropHeight,
        x: cropX,
        y: cropY,
      } = easyCropRef.current.cropPixelsRef.current;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, cropWidth, cropHeight);

      ctx.drawImage(
        imgSource,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // get the new image
      const { type, name, uid } = fileRef.current;
      canvas.toBlob(
        async (blob) => {
          const newFile = Object.assign(
            new File([blob as BlobPart], name, { type }),
            { uid }
          ) as File;

          if (!beforeUploadRef.current) {
            return resolveRef.current(newFile);
          }

          const rcFile = newFile as unknown as RcFile;
          const result = await beforeUploadRef.current(rcFile, [rcFile]);

          if (result === true) {
            return resolveRef.current(newFile);
          }

          if (result === false) {
            return rejectRef.current(new Error("beforeUpload return false"));
          }

          delete newFile[AntUpload.LIST_IGNORE as keyof typeof newFile];

          if (result === AntUpload.LIST_IGNORE) {
            Object.defineProperty(newFile, AntUpload.LIST_IGNORE, {
              value: true,
              configurable: true,
            });
            return rejectRef.current(
              new Error("beforeUpload return LIST_IGNORE")
            );
          }

          if (typeof result === "object" && result !== null) {
            return resolveRef.current(result);
          }
        },
        type,
        quality
      );
    },
    [fillColor, quality, rotate]
  );

  return (
    <>
      {uploadComponent}
      {image && (
        <AntModal
          open
          wrapClassName={`${PREFIX}-modal ${modalClassName || ""}`}
          title={"编辑"}
          onOk={onOk}
          onCancel={onCancel}
          maskClosable={false}
          destroyOnClose
          {...modalProps}
        >
          <EasyCrop
            ref={easyCropRef}
            cropperRef={cropperRef}
            image={image}
            aspect={aspect}
            shape={shape}
            grid={grid}
            zoom={zoom}
            rotate={rotate}
            minZoom={minZoom}
            maxZoom={maxZoom}
            cropperProps={cropperProps as EasyCropProps["cropperProps"]}
          />
        </AntModal>
      )}
    </>
  );
});

export default ImgCrop;
