import db from "../config/db";
import type {Request, Response} from "express";

import { ClientRepository } from "../repositories/client.repository";

import { CreateClientDTO, GetClientsDTO, UpdateClientDTO } from "../types/client.types";
import {
  rfcFormat,
  phoneFormat,
  emailFormat
} from "../utils/sql.utils";

const clientRepository = new ClientRepository(db);

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

      const checkNameUse = clientRepository.checkNameUse(name);
      if(checkNameUse) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
      if(!rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});

      if(email !== undefined && !emailFormat(email as string)) return res.status(400).json({"success": false, "message": "E-mail inválido."});
      const validatePhone = phoneFormat(phone);
      if(validatePhone === 'error') return res.status(400).json({"success": false, "message": "El número de telefono ingresado no tiene el formato valido."});

      const clientData: CreateClientDTO = {
        name: name,
        rfc: rfc,
        address: address,
        phone: phone ? phoneFormat(phone) : null,
        email: email ?? null
      }

      const result = clientRepository.create(clientData);
      
      if(result.changes === 0) return res.status(400).json({"success": false, "message": "No se ha creado el cliente. Revise sus datos enviados."});

      res.status(201).json({
        "success": true,
        "message": "¡Cliente creado con éxito!",
        "data": clientData
      })
    }catch(err: any){
      console.log("ERROR:" + err);

      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({ success: false, message: "El cliente o RFC ya está registrado." });
      }

      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      })
    }
  },

  getClientById: async(req: Request, res: Response) => {
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
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  },

  getClients: async (req: Request<{}, {}, {}, GetClientsDTO>, res: Response) => {
    try{
      const filters = req.query;
      const result = clientRepository.findAll(filters);

      if(result.length === 0) return res.status(204).json({"success": true, "message": "No se han encontrado clientes."});
      
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
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  },

  searchClients: async (req: Request<{}, {}, {}, {name: string}>, res: Response) => {
    try {
      const { name } = req.query;
      
      if(!name || name === undefined || name.trim() === ''){
        return res.status(200).json([])
      }
      
      const result = clientRepository.searchByName(name);

      return res.status(200).json(result);
    } catch(err: any) {
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  },

  updateClient: async (req: Request<any, {}, UpdateClientDTO>, res: Response) => {
    try{
      const { id } = req.params;
      const { name, rfc, address, phone, email } = req.body;

      const idNumber = Number(id);

      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      if(name !== null && name !== undefined) {
        if (name.length < 3 || name.length > 80) return res.status(400).json({"success": false, "message": "El nombre del cliente debe tener entre 3 y 80 caracteres."});
        if(clientRepository.checkNameUse(name, id)) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
      }

      if(rfc !== null && rfc !== undefined && !rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});

      if(address !== null && rfc !== undefined && (address.length < 10 || address.length > 300)) return res.status(400).json({"success": false, "message": "La dirección del cliente debe tener entre 10 y 300 caracteres."});

      if(phone !== null && rfc !== undefined && phoneFormat(phone) === 'error') return res.status(400).json({"success": false, "message": "El número de telefono ingresado no tiene el formato valido."});
    
      if(email !== null && rfc !== undefined && !emailFormat(email)) return res.status(400).json({"success": false, "message": "E-Mail inválido."});

      const clientData: UpdateClientDTO = {
        id: id,
        name: name ?? null,
        rfc: rfc ?? null,
        address:  address ?? null,
        phone: phone ?? null,
        email: email ?? null
      }

      if(Object.keys(clientData).length < 2) return res.status(400).json({"success": false, "message": "No se ha introducido por lo menos un valor por modificar."});

      const result = clientRepository.update(clientData);

      return res.status(200).json({
        "success": true,
        "message": `Cliente actualizado exitosamente${(result.changes === 0) ? '(No se han hecho cambios)' : ''}.`
      });
    }catch(err: any){
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  },

  deleteClient: async (req: Request, res: Response) => {
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
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  }
}