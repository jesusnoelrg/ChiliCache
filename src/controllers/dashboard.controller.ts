import type { Request, Response } from 'express';
import db from '../config/db';


export const DashboardController = {
  getStats: async (req: Request, res: Response) => {
    try {
      let query = `
      SELECT
        (SELECT COUNT(*) FROM clients) AS clients,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM sales) as sales
      `

      const stats = db.prepare(query).all();

      return res.status(200).json({"success": true, stats});
    } catch (err: any) {
      console.log("ERROR:" + err);
      return res.status(500).json({
        "success": false,
        "message": "Error en la base de datos."
      });
    }
  }
}