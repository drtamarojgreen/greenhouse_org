# Sorrel-Driven C++ Movie Engine Makefile
CXX = g++
CXXFLAGS = -O3 -Wall -std=c++17
INCLUDES = -Isrc -Iinclude -Itests/cpp/util

all: movie_engine sorrel_runner integrity_runner interaction_runner asset_runner environment_runner quality_runner credits_runner facial_runner resource_runner

movie_engine: src/movie_engine.cpp include/SceneNodes.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) src/movie_engine.cpp -o ../../../movie_engine

sorrel_runner: tests/cards/SceneLogicCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/SceneLogicCards.cpp -o ../../../sorrel_runner

integrity_runner: tests/cards/AnimationIntegrityCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/AnimationIntegrityCards.cpp -o ../../../integrity_runner

interaction_runner: tests/cards/InteractionLogicCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/InteractionLogicCards.cpp -o ../../../interaction_runner

asset_runner: tests/cards/AssetValidationCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/AssetValidationCards.cpp -o ../../../asset_runner

environment_runner: tests/cards/EnvironmentLogicCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/EnvironmentLogicCards.cpp -o ../../../environment_runner

quality_runner: tests/cards/ProductionQualityCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/ProductionQualityCards.cpp -o ../../../quality_runner

credits_runner: tests/cards/CreditLogicCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/CreditLogicCards.cpp -o ../../../credits_runner

retreat_runner: tests/cards/RetreatLogicCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/RetreatLogicCards.cpp -o ../../../retreat_runner

renderer_runner: tests/cards/RendererIntegrityCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/RendererIntegrityCards.cpp -o ../../../renderer_runner

modeler_runner: tests/cards/ModelingOperatorCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/ModelingOperatorCards.cpp -o ../../../modeler_runner

loader_runner: tests/cards/MeshLoaderCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/MeshLoaderCards.cpp -o ../../../loader_runner

facial_runner: tests/cards/FacialRigCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/FacialRigCards.cpp -o ../../../facial_runner

resource_runner: tests/cards/ResourceAnalysisCards.cpp tests/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) tests/cards/ResourceAnalysisCards.cpp -o ../../../resource_runner

clean:
	rm -f ../../../movie_engine ../../../sorrel_runner ../../../integrity_runner ../../../interaction_runner ../../../asset_runner ../../../environment_runner ../../../quality_runner ../../../credits_runner ../../../facial_runner ../../../resource_runner
