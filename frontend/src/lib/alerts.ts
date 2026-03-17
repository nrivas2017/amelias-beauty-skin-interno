import Swal from "sweetalert2";

const MUI_PRIMARY = "#1976d2";
const MUI_ERROR = "#d32f2f";
const MUI_CANCEL = "#9e9e9e";

const swalMuiStyle = Swal.mixin({
  confirmButtonColor: MUI_PRIMARY,
  cancelButtonColor: MUI_CANCEL,
  padding: "1.5rem",
});

export const showAlert = {
  success: (title: string, text?: string) => {
    return swalMuiStyle.fire({
      icon: "success",
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  },
  error: (title: string, text?: string) => {
    return swalMuiStyle.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "Entendido",
      confirmButtonColor: MUI_ERROR,
    });
  },
  warning: (title: string, text?: string) => {
    return swalMuiStyle.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: "Aceptar",
      confirmButtonColor: MUI_PRIMARY,
    });
  },
  info: (title: string, text?: string) => {
    return swalMuiStyle.fire({
      icon: "info",
      title,
      text,
      confirmButtonText: "Aceptar",
    });
  },
  confirm: async (
    title: string,
    text: string,
    confirmText = "Sí, continuar",
    cancelText = "Cancelar",
  ) => {
    const result = await swalMuiStyle.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    });
    return result.isConfirmed;
  },
  prompt: async (
    title: string,
    text: string,
    placeholder = "",
    confirmText = "Aceptar",
    cancelText = "Cancelar",
  ) => {
    const result = await swalMuiStyle.fire({
      title,
      text,
      input: "text",
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    });
    return result.isDismissed ? null : result.value || "";
  },
};
