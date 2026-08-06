import db from "../config/db";
import type { Request, Response, NextFunction } from "express";

import { ClientRepository } from "../repositories/client.repository";

import { CreateClientDTO, GetClientsDTO, UpdateClientDTO } from "../types/client.types";
import {
  rfcFormat,
  phoneFormat,
  emailFormat
} from "../utils/sql.utils";

const clientRepository = new ClientRepository(db);

export const ClientController = {
  createClient: async(req: Request<{}, {}, CreateClientDTO>, res: Response, next: NextFunction) => {
    try{
      const { name, rfc, address, phone, email } = req.body;

      if(!name || !rfc || !address){
        return res.status(400).json({
          success: false,
          message: "Faltan campos requeridos",
          missing: {
            name: !name,
            rfc: !rfc,
            address: !address
          }
        });
      }

      const checkNameUse = clientRepository.checkNameUse(name);
      if(checkNameUse) return res.status(409).json({success: false, message: "¡Ese nombre ya esta en uso!"});
      if(!rfcFormat(rfc)) return res.status(400).json({success: false, message: "Ingresa un RFC valido."});

      if(email !== undefined && !emailFormat(email as string)) {
        return res.status(400).json({
          success: false, 
          message: "E-mail inválido."
        });
      }
      const validatePhone = phoneFormat(phone);
      if(phone && validatePhone === null) {
        return res.status(400).json({
          success: false, 
          message: "El número de telefono ingresado no tiene el formato valido."
        });
      }

      const clientData: CreateClientDTO = {
        name: name,
        rfc: rfc,
        address: address,
        phone: phone ? validatePhone : null,
        email: email ?? null
      }

      const result = clientRepository.create(clientData);
      
      if(result.changes === 0){
        return res.status(400).json({
          success: false, 
          message: "No se ha creado el cliente. Revise sus datos enviados."
        });
      }

      res.status(201).json({
        success: true,
        message: "¡Cliente creado con éxito!",
        data: clientData
      })
    }catch(err: any){
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ success: false, message: "El cliente o RFC ya está registrado." });
      }

      next(err);
    }
  },

  getClientById: async(req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber: number = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const result = clientRepository.findById(idNumber);
      
      if(result == null) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idNumber}) no existe.`});

      return res.status(200).json({
        "success": true,
        "data": result
      })
    }catch(err: any){
      next(err);
    }
  },

  getClients: async (req: Request<{}, {}, {}, GetClientsDTO>, res: Response, next: NextFunction) => {
    try{
      const filters = req.query;
      const result = clientRepository.findAll(filters);

      if(result.length === 0) {
        return res.status(200).json({
          "success": true, 
          "metadata": {
            limit: Number(filters.limit || 10),
            offset: Number(filters.offset || 0),
            count: result.length
          },
          "data": []
        });
      }
      
      return res.status(200).json({
        "success": true,
        "metadata": {
          limit: Number(filters.limit || 10),
          offset: Number(filters.offset || 0),
          count: result.length
        },
        "data": result
      });
    }catch(err: any){
      next(err);
    }
  },

  searchClients: async (req: Request<{}, {}, {}, {name: string}>, res: Response, next: NextFunction) => {
    try {
      const { name } = req.query;
      
      if(!name || name === undefined || name.trim() === ''){
        return res.status(200).json([])
      }
      
      const result = clientRepository.searchByName(name);

      return res.status(200).json(result);
    } catch(err: any) {
      next(err);
    }
  },

  updateClient: async (req: Request<any, {}, UpdateClientDTO>, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;
      const { name, rfc, address, phone, email } = req.body;

      const idNumber = Number(id);

      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      if(name !== undefined) {
        if (name.length < 3 || name.length > 80) return res.status(400).json({"success": false, "message": "El nombre del cliente debe tener entre 3 y 80 caracteres."});
        if(clientRepository.checkNameUse(name, id)) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
      }

      if(rfc !== undefined && !rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});

      if(address !== undefined && (address.length < 10 || address.length > 300)) return res.status(400).json({"success": false, "message": "La dirección del cliente debe tener entre 10 y 300 caracteres."});

      if(phone !== undefined && phoneFormat(phone) === 'error') return res.status(400).json({"success": false, "message": "El número de telefono ingresado no tiene el formato valido."});
    
      if(email !== undefined && !emailFormat(email)) return res.status(400).json({"success": false, "message": "E-Mail inválido."});

      const clientData: UpdateClientDTO = {
        name: name ?? undefined,
        rfc: rfc ?? undefined,
        address:  address ?? undefined,
        phone: phone ?? undefined,
        email: email ?? undefined
      }

      if(Object.keys(clientData).length === 0) return res.status(400).json({"success": false, "message": "No se ha introducido por lo menos un valor por modificar."});

      const result = clientRepository.update(idNumber, clientData);

      if(result.changes === 0 || !result){
        return res.status(400).json({
          success: false,
          message: "No se han realizado cambios en el cliente."
        });
      }

      return res.status(200).json({
        "success": true,
        "message": `Cliente actualizado exitosamente.`
      });
    }catch(err: any){
      next(err);
    }
  },

  deleteClient: async (req: Request, res: Response, next: NextFunction) => {
    try{
      const { id } = req.params;

      const idNumber = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const checkClientId = clientRepository.findById(idNumber);
      if(checkClientId == null) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idNumber}) no existe.`});

      const result = clientRepository.delete(idNumber);

      if(result.changes === 0) return res.sendStatus(204);

      return res.status(200).json({"success": true, "message": "Cliente eliminado exitosamente."});
    }catch(err: any){
      next(err);
    }
  }
}