// gl-leather-designs-final-backend/src/utils.ts

import { Request, Response, NextFunction } from 'express';

// Definición de asyncHandler usando 'any' para evitar conflictos de tipo con Express.
// Esto es una solución pragmática para entornos donde los tipos son problemáticos,
// forzando la compatibilidad con RequestHandler de Express.
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | void) => {
    // El tipo de retorno es 'any' para evitar el error TS2769 en las rutas de Express
    return (async (req: Request, res: Response, next: NextFunction) => {
        try {
            await Promise.resolve(fn(req, res, next));
        } catch (error) {
            next(error);
        }
    }) as any; // <-- ¡Forzamos el tipo a 'any' aquí!
};