import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';

import logo from '../../assets/logo.svg';
import api from '../../services/api';
import Dropzone from '../../components/Dropzone';


interface Items {
    id: number,
    title: string,
    image_url: string
}

interface StatesIBGE {
    id: number,
    nome: string,
    sigla: string,
}

interface CityIBGE {
    nome: string
}

interface States {
    name: string,
    initial: string,
}


const CreatePoint = () => {
    /*
        Estamos definindo um estado para esse objeto. Nesse estado serão guardados os itens buscados
        com a API.
        O estado começa vazio e são imutáveis. Ele é um vetor que contém na primeira posição o valor
        armazenado e na segunda posição a função para mudar seu valor.

    */
    /*
        Sempre que um estado retornar um array ou objeto, é preciso informar o tipo dos dados sendo
        retornados.
    */
    const [items, setItems] = useState<Items[]>([]);
    const [states, setStates] = useState<States[]>([]);
    const [cities, setCity] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const [selectedState, setSelectedState] = useState("0");
    const [selectedCity, setSelectedCity] = useState("0");

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });
    
    const history = useHistory();
    /*
        Nosso objetivo é fazer somente uma chamada a API para buscar os itens, pois esses itens são
        fixos.

        useEffect é uma função que recebe dois parâmetros.
        O primeiro é a função que ele vai executar.
        O segundo é quando ele vai executar essa função. Esse quando, é sempre que o que for passado 
        como segundo parâmetro mudar. Como o vetor vai ser inicializado vazio e nunca vai mudar, a 
        função passada no primeiro parâmetro só vai ser executada uma vez.

        A chamada a API não pode ficar direto dentro do componente, senão toda vez que o componente
        tiver seu estado alterado ou algum item for alterado/adicionado/removido, essa chamada seria 
        efetuada, já que todo o componente é recarregado quando há uma alteração nele.
    */
    useEffect(() => {
        //TODD: tratar quando o usuário bloquear a geolocalização
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);
            setSelectedPosition([latitude, longitude]);
        });
    }, []);
    
    useEffect(() => {
        /*
            Não precisa colocar a rota completa, pois a url base está configurada dentro do axios.
         */
        api.get('items').then(response => {
            setItems(response.data)
        });
    }, []);

    useEffect(() => {
        axios.get<StatesIBGE[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
            const statesIBGE = response.data.map(state => {
                return {
                    name: state.nome,
                    initial: state.sigla
                }
            });
            setStates(statesIBGE);
        });
    }, []);

    useEffect(() => {
        // carregar as cidades sempre que a combo de estados mudar
        if(selectedState === '0') {
            setCity([]);
            return;
        }

        axios
            .get<CityIBGE[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
            .then(response => {
                const cityIBGE = response.data.map(city => city.nome);

                setCity(cityIBGE);
        });
    }, [selectedState]);

    function handleSelectState(event: ChangeEvent<HTMLSelectElement>) {
        const stateInitial = event.target.value;

        setSelectedState(stateInitial);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        //Toda vez que o set é chamado, ele substitui o valor antigo, então é preciso pegar o 
        //valor antigo e armazenar ele. Depois a gente substitui o valor novo.
        //TODO: Ele está fazendo uma substituição que eu não entendi. Estudar!!!
        setFormData({ ...formData, [name]: value});
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { name, email, whatsapp} = formData;
        const state = selectedState;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('state', state);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile) data.append('image', selectedFile);

        await api.post('points', data);

        //TODO: Melhorar essa mensagem de retorno, tem que tratar quando der erro tb. Tem um tela no site de 
        //navegação do aplicativo.
        alert('Ponto de coleta criado');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            {/* TODO: transformar esse header num componente. Tem na Home tb. */}
            <header>
                <img src={logo} alt="Ecoleta" />

                <Link to='/'>
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do ponto de coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile}/>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="text"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o enderço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="state">Estado (UF)</label>
                            <select 
                                name="state"
                                id="state"
                                value={selectedState}
                                onChange={handleSelectState}
                            >
                                <option value="0">Selecione um Estado (UF)</option>
                                {states.map(state => (
                                    <option key={state.initial} value={state.initial}>{state.name + " - " + state.initial}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                name="city"
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectCity}
                            >
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id}
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li> 
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
};

export default CreatePoint;