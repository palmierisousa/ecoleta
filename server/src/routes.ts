import express from 'express';
import PointsController from './controllers/PointsControllers';
import ItemsController from './controllers/ItemsControllers';

const routes = express.Router();
const pointsController = new PointsController();
const itemsController = new ItemsController();

//index, show, create, update, delete
//TODO: entender essa passagem de função itemsController.index
routes.get('/items', itemsController.index);

routes.post('/points', pointsController.create);
routes.get('/points', pointsController.index);
routes.get('/points/:id', pointsController.show);

export default routes;

// Service pattern para abstrair todo o tipo de lógica de dentro dos controllers
// Repository pattern (Data mapper) para tudo que envolver banco de dados