"use strict";
// gl-leather-designs-final-backend/src/utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
// Definición de asyncHandler usando 'any' para evitar conflictos de tipo con Express.
// Esto es una solución pragmática para entornos donde los tipos son problemáticos,
// forzando la compatibilidad con RequestHandler de Express.
const asyncHandler = (fn) => {
    // El tipo de retorno es 'any' para evitar el error TS2769 en las rutas de Express
    return (async (req, res, next) => {
        try {
            await Promise.resolve(fn(req, res, next));
        }
        catch (error) {
            next(error);
        }
    }); // <-- ¡Forzamos el tipo a 'any' aquí!
};
exports.asyncHandler = asyncHandler;
