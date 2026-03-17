import Swal from 'sweetalert2'

const swalWithTailwindButtons = Swal.mixin({
  customClass: {
    confirmButton: 'bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md font-medium mx-2 transition-colors',
    cancelButton: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md font-medium mx-2 transition-colors',
    popup: 'rounded-xl shadow-xl border border-gray-100',
    title: 'text-gray-900 font-semibold',
    htmlContainer: 'text-gray-600'
  },
  buttonsStyling: false
})

export const showAlert = {
  success: (title: string, text?: string) => {
    return swalWithTailwindButtons.fire({
      icon: 'success',
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  },
  error: (title: string, text?: string) => {
    return swalWithTailwindButtons.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Entendido',
    })
  },
  warning: (title: string, text?: string) => {
    return swalWithTailwindButtons.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'Aceptar',
    })
  },
  info: (title: string, text?: string) => {
    return swalWithTailwindButtons.fire({
      icon: 'info',
      title,
      text,
      confirmButtonText: 'Aceptar',
    })
  },
  confirm: async (title: string, text: string, confirmText = 'Sí, continuar', cancelText = 'Cancelar') => {
    const result = await swalWithTailwindButtons.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    })
    return result.isConfirmed
  },
  prompt: async (title: string, text: string, placeholder = '', confirmText = 'Aceptar', cancelText = 'Cancelar') => {
    const result = await swalWithTailwindButtons.fire({
      title,
      text,
      input: 'text',
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    })
    return result.isDismissed ? null : (result.value || '')
  }
}
