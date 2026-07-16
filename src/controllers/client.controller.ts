import db from "../config/db";
import type {Request, Response} from "express";
import { CreateClientDTO, GetClientsDTO, UpdateClientDTO } from "../types/client.types";
import {
  generateInsertHelper,
  updateHelper,
  rfcFormat,
  phoneFormat,
  emailFormat
} from "../utils/sql.utils";
import { isRecordFieldPresent } from "../utils/db.utils";

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

      const checkNameUse = isRecordFieldPresent({table: 'clients', column: 'name', value: name})
      if(checkNameUse) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
      if(!rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});

      const clientData: any = {
        name: name,
        rfc: rfc,
        address: address
      }

      if(phone !== undefined){
        const validatePhone = phoneFormat(phone);
        if(validatePhone == null) return res.status(400).json({"success": false, "message": "El número de telefono ingresado no tiene el formato valido."});
        clientData.phone = validatePhone;
      }

      if(email !== undefined){
        if(!emailFormat(email as string)) return res.status(400).json({"success": false, "message": "E-mail inválido."});
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
  },

  getClientById: async(req: Request, res: Response) => {
    try{
      const { id } = req.params;

      const idNumber: number = Number(id);
      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const checkClientId = isRecordFieldPresent({table: "clients", column: "id", value: idNumber});
      if(!checkClientId) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idNumber}) no existe.`});

      const result = db.prepare("SELECT * FROM clients WHERE id = :id").get({id});
      
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
      const { name, rfc, address, phone, email, limit, offset } = req.query;

      const limitNumber = Number(limit || 10);
      const offsetNumber = Number(offset || 0);

      const clientData: any = {
        limit: limitNumber,
        offset: offsetNumber
      }
      
      let query = `SELECT * FROM clients WHERE 1 = 1`;

      if(name !== undefined){
        clientData.name = `%${name}%`;
        query += " AND name LIKE :name";
      }
      if(rfc !== undefined){
        clientData.rfc = `%${rfc}%`;
        query += " AND rfc LIKE :rfc";
      }
      if(address !== undefined){
        clientData.address = `%${address}%`;
        query += " AND address LIKE :address";
      }
      if(phone !== undefined){
        clientData.phone = `%${phone}%`;
        query += " AND phone LIKE :phone";
      }
      if(email !== undefined){
        clientData.email = `%${email}%`;
        query += " AND email LIKE :email";
      }

      query += " LIMIT :limit OFFSET :offset"
      const result = db.prepare(query).all(clientData);

      if(result.length === 0) return res.status(204).json({"success": true, "message": "No se han encontrado clientes."});
      
      return res.status(200).json({
        "success": true,
        "metadata": {
          limit: clientData.limit,
          offset: clientData.offset,
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

  updateClient: async (req: Request<any, {}, UpdateClientDTO>, res: Response) => {
    try{
      const { id } = req.params;
      const { name, rfc, address, phone, email } = req.body;

      const idNumber = Number(id);

      if(isNaN(idNumber)) return res.status(400).json({"success": false, "message": "ID inválido."});

      const clientData: any = {
        id: id
      }

      if(name !== undefined){
        if(name.length < 3 || name.length > 80) return res.status(400).json({"success": false, "message": "El nombre del cliente debe tener entre 3 y 80 caracteres."});
        const checkNameUse = checkNameAvailable(name, id);
        if(checkNameUse) return res.status(409).json({"success": false, "message": "¡Ese nombre ya esta en uso!"});
        clientData.name = name;
      }

      if(rfc !== undefined){
        if(!rfcFormat(rfc)) return res.status(400).json({"success": false, "message": "Ingresa un RFC valido."});
        clientData.rfc = rfc;
      }

      if(address !== undefined){
        if(address.length < 10 || address.length > 300) return res.status(400).json({"success": false, "message": "La dirección del cliente debe tener entre 10 y 300 caracteres."});
        clientData.address = address;
      }

      if(phone !== undefined){
        const validatePhone = phoneFormat(phone);
        if(validatePhone == null) return res.status(400).json({"success": false, "message": "El número de telefono ingresado no tiene el formato valido."});
        clientData.phone = validatePhone;
      } else {
        clientData.phone = null;
      }
      
      if(email !== undefined){
        if(!emailFormat(email)) return res.status(400).json({"success": false, "message": "E-Mail inválido."});
        clientData.email = email
      } else {
        clientData.email = null;
      }

      if(Object.keys(clientData).length < 2) return res.status(400).json({"success": false, "message": "No se ha introducido por lo menos un valor por modificar."});

      const set_clausule = updateHelper(clientData);
      const result = db.prepare(`UPDATE clients SET ${set_clausule} WHERE id = :id`).run(clientData);

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

      const checkClientId = isRecordFieldPresent({table: 'clients', column: 'id', value: idNumber});
      if(!checkClientId) return res.status(404).json({"success": false, "message": `El cliente con el (ID: ${idNumber}) no existe.`});

      const result = db.prepare("DELETE FROM clients WHERE id = :id").run({idNumber});

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

const checkNameAvailable = (name: string, id?: number): boolean => {
  if(!name) return false;

  let data: any = { name };
  let query = `SELECT name FROM clients WHERE name = :name`;

  if(id !== undefined && id){
    query += " AND id != :id";
    data.id = Number(id);
  }

  const validate = db.prepare(query).get(data);

  if(validate){
    return true;
  }

  return false;
}