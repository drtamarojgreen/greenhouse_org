# Chai-Driven C++ Movie Engine Makefile
CXX = g++
CXXFLAGS = -O3 -Wall -std=c++17
INCLUDES = -Isrc -Itest/cpp/util

all: movie_engine chai_runner integrity_runner interaction_runner asset_runner environment_runner quality_runner credits_runner facial_runner resource_runner

movie_engine: src/movie_engine.cpp src/SceneNodes.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) src/movie_engine.cpp -o ../../../movie_engine

chai_runner: test/cards/SceneLogicCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/SceneLogicCards.cpp -o ../../../chai_runner

integrity_runner: test/cards/AnimationIntegrityCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/AnimationIntegrityCards.cpp -o ../../../integrity_runner

interaction_runner: test/cards/InteractionLogicCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/InteractionLogicCards.cpp -o ../../../interaction_runner

asset_runner: test/cards/AssetValidationCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/AssetValidationCards.cpp -o ../../../asset_runner

environment_runner: test/cards/EnvironmentLogicCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/EnvironmentLogicCards.cpp -o ../../../environment_runner

quality_runner: test/cards/ProductionQualityCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/ProductionQualityCards.cpp -o ../../../quality_runner

credits_runner: test/cards/CreditLogicCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/CreditLogicCards.cpp -o ../../../credits_runner

retreat_runner: test/cards/RetreatLogicCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/RetreatLogicCards.cpp -o ../../../retreat_runner

renderer_runner: test/cards/RendererIntegrityCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/RendererIntegrityCards.cpp -o ../../../renderer_runner

modeler_runner: test/cards/ModelingOperatorCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/ModelingOperatorCards.cpp -o ../../../modeler_runner

loader_runner: test/cards/MeshLoaderCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/MeshLoaderCards.cpp -o ../../../loader_runner

facial_runner: test/cards/FacialRigCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/FacialRigCards.cpp -o ../../../facial_runner

resource_runner: test/cards/ResourceAnalysisCards.cpp test/cpp/util/FactReader.hpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) test/cards/ResourceAnalysisCards.cpp -o ../../../resource_runner

clean:
	rm -f ../../../movie_engine ../../../chai_runner ../../../integrity_runner ../../../interaction_runner ../../../asset_runner ../../../environment_runner ../../../quality_runner ../../../credits_runner ../../../facial_runner ../../../resource_runner
