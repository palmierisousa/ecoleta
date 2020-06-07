import React, { useState, useEffect, ChangeEvent } from 'react';
import { Feather as Icon } from "@expo/vector-icons";
import { View, ImageBackground, Text, Image, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';

interface Picker {
    label: string,
    value: string,
}

interface StatesIBGE {
    id: number,
    nome: string,
    sigla: string,
}

interface CityIBGE {
    nome: string
}

const Home = () => {
    const [states, setStates] = useState<Picker[]>([]);
    const [cities, setCity] = useState<Picker[]>([]);

    const [selectedState, setSelectedState] = useState("0");
    const [selectedCity, setSelectedCity] = useState("0");
    
    const navigation = useNavigation();

    useEffect(() => {
        axios.get<StatesIBGE[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
            const statesIBGE = response.data.map(state => {
                return {
                    label: `${state.nome}, ${state.sigla}`,
                    value: state.sigla
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
                const cityIBGE = response.data.map(city => {
                    return {
                        label: city.nome,
                        value: city.nome
                    }
                });

                setCity(cityIBGE);
        });
    }, [selectedState]);

    const handleSelectState = (value: string) => setSelectedState(value);
    const handleSelectCity = (value: string) => setSelectedCity(value);
    
    function handleNavigateToPoints() {
        navigation.navigate('Points', {
            state: selectedState,
            city: selectedCity
        });
    }

    return (
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ImageBackground
                source={require('../../assets/home-background.png')}
                style={styles.container}
                imageStyle={{ width: 274, height: 368 }}
            >
                <View style={styles.main}>
                    <Image source={require('../../assets/logo.png')} />
                    <View>
                        <Text style={styles.title}>Seu marketplace de coleta de resíduos</Text>
                        <Text style={styles.description}>Ajudamos pessoas a encontrarem pontos de coleta de forma eficiente.</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <RNPickerSelect
                        style={pickerStyle}
                        onValueChange={handleSelectState}
                        items={states}
                        placeholder={{label: 'Selecione o Estado', value: '0'}}
                    />
                    <RNPickerSelect
                        style={pickerStyle}
                        onValueChange={handleSelectCity}
                        items={cities}
                        placeholder={{label: 'Selecione a Cidade', value: '0'}}
                    />
                    {/* <TextInput 
                        style={styles.input}
                        placeholder='Selecione o Estado'
                        value={state}
                        onChangeText={setState}
                    />
                    <TextInput 
                        style={styles.input}
                        placeholder='Selecione a Cidade'
                        value={city}
                        onChangeText={setCity}
                    /> */}

                    <RectButton style={styles.button} onPress={handleNavigateToPoints}>
                        <View style={styles.buttonIcon}>
                            <Text>
                                <Icon name="arrow-right" color="#FFF" size={24} />
                            </Text>
                        </View>
                        <Text style={styles.buttonText}>
                            Entrar
                    </Text>
                    </RectButton>
                </View>
            </ImageBackground>
        </KeyboardAvoidingView>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 32
    },

    main: {
        flex: 1,
        justifyContent: 'center',
    },

    title: {
        color: '#322153',
        fontSize: 32,
        fontFamily: 'Ubuntu_700Bold',
        maxWidth: 260,
        marginTop: 64,
    },

    description: {
        color: '#6C6C80',
        fontSize: 16,
        marginTop: 16,
        fontFamily: 'Roboto_400Regular',
        maxWidth: 260,
        lineHeight: 24,
    },

    footer: {},

    select: {},

    input: {
        height: 60,
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 8,
        paddingHorizontal: 24,
        fontSize: 16,
    },

    button: {
        backgroundColor: '#34CB79',
        height: 60,
        flexDirection: 'row',
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        marginTop: 8,
    },

    buttonIcon: {
        height: 60,
        width: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    buttonText: {
        flex: 1,
        justifyContent: 'center',
        textAlign: 'center',
        color: '#FFF',
        fontFamily: 'Roboto_500Medium',
        fontSize: 16,
    }
});

const pickerStyle = {
    viewContainer: {
      backgroundColor: '#fff',
      borderRadius: 10,
      height: 60,
      paddingHorizontal: 24,
      marginBottom: 8,
    },
    inputAndroid: {
      fontSize: 18,
      height: 60,
      color: '#333',
    },
  };

export default Home;