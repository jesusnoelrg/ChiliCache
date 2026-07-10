import db from "../config/db";
import type {Request, Response} from "express";
import { CreateClientDTO } from "../types/client.types";
import {
  generateInsertHelper,
  rfcFormat,
  phoneFormat,
  mailFormat
} from "../utils/sql.utils";

export const ClientController = {
  createClient: async(req: Request<{}, {}, CreateClientDTO>, res: Response) => {
    try{
      const { name, rfc, address, phone, email } = req.body;

      if(!name || !rfc || !address){
        return res.status(400).json({
          "success": false,
          "message": "Faltan campos requeridos",
          "missing": {
            "name": !name,
            "rfc": !rfc,
            "address": !address
          }
        });
      }

      if(clientNameUse(name)) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
      if(!rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});

      const clientData: any = {
        name: name,
        rfc: rfc,
        address: address
      }

      if(phone !== undefined){
        const validatePhone = phoneFormat(phone);
        if(validatePhone == null) return res.status(400).json({"success": false, "message": "El número ingresado no tiene el formato valido."});
        clientData.phone = validatePhone;
      }

      if(email !== undefined){
        if(!mailFormat(email as string)) return res.status(400).json({"success": false, "message": "E-mail inválido."});
        clientData.email = email;
      }

      const { columns, placeholders } = generateInsertHelper(clientData);
      const result = db.prepare(`INSERT INTO clients (${columns}) VALUES (${placeholders})`).run(clientData);
      
      if(result.changes === 0) return res.status(400).json({"success": false, "message": "No se ha creado el cliente. Revise sus datos enviados."});

      res.status(201).json({
        "success": true,
        "message": "¡Cliente creado con éxito!",
        "data": clientData
      })
    }catch(err: any){
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      })
    }
  }
}

const clientNameUse = (name: string): boolean => {
  if (!name) return false;
  const result = db.prepare('SELECT name FROM clients WHERE name = :name').get({ name });
  return result !== undefined;
};