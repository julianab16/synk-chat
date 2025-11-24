// Utilidades de validación
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateMessage = (data: any): boolean => {
  if (!data) {
    throw new ValidationError('Datos vacíos');
  }

  if (!data.roomId || typeof data.roomId !== 'string') {
    throw new ValidationError('roomId inválido o faltante');
  }

  if (!data.sender || typeof data.sender !== 'string') {
    throw new ValidationError('sender inválido o faltante');
  }

  if (!data.message || typeof data.message !== 'string') {
    throw new ValidationError('message inválido o faltante');
  }

  if (data.message.trim().length === 0) {
    throw new ValidationError('El mensaje no puede estar vacío');
  }

  if (data.message.length > 5000) {
    throw new ValidationError('El mensaje es demasiado largo (máximo 5000 caracteres)');
  }

  return true;
};

export const validateRoomId = (roomId: any): boolean => {
  if (!roomId || typeof roomId !== 'string') {
    throw new ValidationError('roomId inválido');
  }

  if (roomId.trim().length === 0) {
    throw new ValidationError('roomId no puede estar vacío');
  }

  // Validar formato de roomId (solo alfanumérico y guiones)
  const roomIdPattern = /^[a-zA-Z0-9-_]+$/;
  if (!roomIdPattern.test(roomId)) {
    throw new ValidationError('roomId contiene caracteres inválidos');
  }

  return true;
};

export const sanitizeMessage = (message: string): string => {
  // Eliminar espacios extras y trim
  return message.trim().replace(/\s+/g, ' ');
};