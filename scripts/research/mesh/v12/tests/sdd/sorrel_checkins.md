# v12 Framework SDD - Sorrel Checkins
# Tracks deferred/unimplemented work for the v12 research pipeline.

## Planned Sips

- [x] Sip 1: Define Abstract Interfaces (BaseStage, BaseModel, BaseTransformer).
- [x] Sip 2: Implement Configuration Schema (Pydantic).
- [x] Sip 3: Implement Pipeline Orchestrator.
- [x] Sip 4: Implement Lifecycle Stages 0 & 1 (Requirements, Data Collection).
- [x] Sip 5: Implement Lifecycle Stages 2 & 3 (Preprocessing, Analysis).
- [x] Sip 6: Implement Lifecycle Stage 4 (Results).
- [x] Sip 7: Implement Reference Plugins (Sklearn Model, Standard Scaler).
- [x] Sip 8: Empirical Verification with Baseline Config.
- [x] Sip 16: Setup Reporting Infrastructure (Metrics, Plots, Exports registries).
- [x] Sip 17: Refactor Results Stage to use Reporting registries.
- [x] Sip 18: Implement extended plugins (XGBoost, CustomNeuralNet, MeshTokenizer, MissingImputer).
- [ ] Sip 19: Comprehensive v12 plugin testing suite.

## Open Issues

- [ ] Handle complex multi-modal data in Preprocessing Stage.
- [ ] Implement advanced hyperparameter tuning (Bayesian Optimization).
