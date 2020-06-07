import {Request, Response} from 'express';
import knex from '../database/connection';

// TODO: Tratar o upload de imagens, colocar para filtrar extensão e o tamanho
// TODO: Serialição ou API Transform para fazer serialização, implementar isso na API
class PointerControllers {
    async index(request: Request, response: Response) {
        //Filter by city, state, items (query params)
        const { city, state, items } = request.query;

        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));
        
        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('state', String(state))
            .distinct()
            .select('points.*');

        const serializedPoint = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.1.6:3333/uploads/${point.image}`
            };
        });
        
        return response.json(serializedPoint);
    }

    async show(request: Request, response: Response) {
        const { id } = request.params;
        
        const point = await knex('points').where('id', id).first();

        if(!point) {
            response.status(400).json({message: 'Point not found'});
        }

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.1.6:3333/uploads/${point.image}`
        };

        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)
            .select('items.title');

        return response.json({ point: serializedPoint, items });
    }
    
    //TODO se é uma função porque não pode colocar a palavra function (antes 1:35:30)
    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            state,
            items
        } = request.body;
    
        const trx = await knex.transaction();
    
        const point = {
            image: request.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            state
        };
        const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
        const pointItems = items
            .split(',')
            .map((item_id: string) => {
            return {
                item_id: item_id.trim(),
                point_id
            };
        });
    
        await trx('point_items').insert(pointItems);

        await trx.commit();
    
        //TODO: caso dê algum erro, está retornando o objeto criado, mas este objeto não é adicionado no banco.
        return response.json({
            id: point_id,
            ...point
        });
    }
}

export default PointerControllers;